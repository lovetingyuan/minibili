#!/usr/bin/env zx
/* globals $, question, echo, chalk, fs, path, retry, spinner */

// import { BuildListSchema } from '../src/api/check-update.schema.ts'
// 1 检查环境 2 写入版本 3 eas构建 4 写入更新日志 5 下载apk 6 git推送
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
})

const pkgPath = require.resolve('../package.json')
const pkg = require('../package.json')
const version = pkg.version
const semver = require('semver')
const assert = require('assert')

const getBuildList = buildStr => {
  let buildListStr = buildStr.toString('utf8')
  buildListStr = buildListStr.substring(buildListStr.lastIndexOf('['))
  const list = JSON.parse(buildListStr)
  // BuildListSchema.parse(list)
  list.toString = () => buildListStr.trim()
  return list
}

$.verbose = false

echo(chalk.blue('checking env...'))

assert.equal(
  typeof process.env.SENTRY_AUTH_TOKEN,
  'string',
  chalk.red('Missing process.env.SENTRY_AUTH_TOKEN'),
)

const gitStatus = await $`git status --porcelain`
assert.equal(
  gitStatus.toString('utf8').trim(),
  '',
  chalk.red('Current git workspace is not clean'),
)

await fetch('https://api.expo.dev')
  .then(res => res.text())
  .then(d => {
    assert.equal(d, 'OK', chalk.red('Can not access Expo Api'))
  })

await $`npm ping && npm whoami --registry=https://registry.npmjs.org/`

await $`git ls-remote https://github.com/lovetingyuan/minibili.git`

const branch = await $`git rev-parse --abbrev-ref HEAD`
assert.equal(
  branch.toString('utf8').trim(),
  'main',
  chalk.red('Current branch is not main'),
)

echo(chalk.blue('fetching current build list...'))

const currentBuild =
  await $`eas build:list --platform android --limit 1 --json --non-interactive --status finished --channel production`
const [{ appVersion }] = getBuildList(currentBuild)
if (appVersion !== version) {
  throw new Error(
    `Package version ${version} is not same as the latest build version ${appVersion}`,
  )
}

// -------------------------------------------

const newVersion = await question(`更新版本（${appVersion} -> ?）`)

if (!semver.valid(newVersion) || semver.lt(newVersion, appVersion)) {
  throw new Error('版本号输入错误')
}

const changes = await question('更新日志（使用双空格分开）')
if (!changes.trim()) {
  throw new Error('更新日志不能为空')
}

pkg.config.versionCode++
pkg.version = newVersion
pkg.config.changelog = changes
const commitHash = (await $`git rev-parse --short HEAD`).toString('utf8').trim()
pkg.gitHead = commitHash

fs.outputJsonSync(pkgPath, pkg)

echo(
  chalk.cyan(
    'eas building: https://expo.dev/accounts/tingyuan/projects/minibili/builds',
  ),
)

let latestBuildList

try {
  await spinner('eas building...', async () => {
    await $`eas build --platform android --profile production --message ${changes} --json --non-interactive`
  })
  echo(chalk.blue('check eas build list...'))
  await new Promise(r => {
    setTimeout(r, 3000)
  })
  let buildListStr = ''

  try {
    buildListStr = await spinner('get eas build list...', () =>
      retry(
        3,
        () =>
          $`eas build:list --platform android --limit 5 --json --non-interactive --status finished --channel production`,
      ),
    )
  } catch (err) {
    echo(chalk.red('Failed to get build list.'))
    throw err
  }

  latestBuildList = getBuildList(buildListStr)
  if (latestBuildList[0].appVersion !== newVersion) {
    throw new Error(
      `EAS latest version ${latestBuildList[0].appVersion} is not same as updated version ${newVersion}`,
    )
  }
} catch (err) {
  await $`git checkout -- .`
  // await $`npm version ${version} -m "failed to publish ${newVersion}" --allow-same-version`
  echo(chalk.red('Failed to build new apk on EAS.'))
  throw err
}

// ---------------------------------------------

echo(chalk.blue('writing version file...'))

await fs.outputJsonSync(
  path.resolve(__dirname, '../docs/version.json'),
  latestBuildList.map(item => {
    return {
      version: item.appVersion,
      changelog: item.gitCommitMessage.split('  '),
      date: item.createdAt,
    }
  }),
  {
    spaces: 2,
  },
)

const apkUrl = latestBuildList[0].artifacts.buildUrl
echo(chalk.blue('download apk file...'))
echo(chalk.cyan(apkUrl))

try {
  await $`rm -rf apk && mkdir -p apk`
  await spinner(
    'downloading...',
    retry(3, () => $`wget ${apkUrl} -q -O ./apk/minibili-${newVersion}.apk`),
  )
} catch (err) {
  echo(chalk.red('Failed to download latest apk.'))
  throw err
}

echo(chalk.blue('publish to npm...'))

try {
  await spinner(
    'publish to npm...',
    retry(3, () => $`npm publish --registry=https://registry.npmjs.org/`),
  )
} catch (err) {
  echo(chalk.red('Failed to publish to npm.'))
  throw err
}

echo(chalk.blue('commit to github...'))

try {
  // await $`git commit -a --amend -C HEAD`
  const message = `release(v${newVersion}): ${changes}`
  await $`git commit -am ${message}`
  await spinner('git push change...', () => retry(5, () => $`git push`))
  await $`git tag -a v${newVersion} -m ${changes}`
  await spinner('git push tag...', () =>
    retry(5, () => $`git push origin v${newVersion}`),
  )
} catch (err) {
  echo(chalk.red('Failed to push to git.'))
  throw err
}

echo(chalk.green('Build done!'))
