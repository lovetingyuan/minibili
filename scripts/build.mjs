#!/usr/bin/env zx
/* globals $, question, echo, chalk, fs, path, retry, spinner */

// import { BuildListSchema } from '../src/api/check-update.schema.ts'
const { version } = require('../package.json')
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

const latestBuild =
  await $`eas build:list --platform android --limit 1 --json --non-interactive --status finished --channel production`
const [{ appVersion, appBuildVersion }] = getBuildList(latestBuild)
if (`${appVersion}-${appBuildVersion}` !== version) {
  throw new Error('Package version is not same as the latest build version')
}

const newVersion = await question(`更新版本（${appVersion} -> ?）`)

if (!semver.valid(newVersion) || semver.lt(newVersion, appVersion)) {
  throw new Error('版本号输入错误')
}

const changes = await question('更新日志（使用双空格分开）')
if (!changes.trim()) {
  throw new Error('更新日志不能为空')
}

echo(chalk.blue('update npm version...'))

await $`npm version ${newVersion}-${
  Number(appBuildVersion) + 1
} -m ${changes} --allow-same-version`

echo(
  chalk.cyan(
    'eas: https://expo.dev/accounts/tingyuan/projects/minibili/builds',
  ),
)

try {
  await spinner('eas building...', async () => {
    const res =
      await $`eas build --platform android --profile production --json --non-interactive`
    const buildList = getBuildList(res)
    if (buildList[0].appVersion !== newVersion) {
      throw new Error('构建未成功')
    }
  })
} catch (err) {
  await $`git checkout -- .`
  await $`npm version ${version} -m "failed to publish ${newVersion}" --allow-same-version`
  echo(chalk.red('Failed to build new apk on EAS.'))
  process.exit(-1)
}
let buildListStr = ''

await new Promise(r => {
  setTimeout(r, 3000)
})

try {
  buildListStr = await spinner('get eas build list...', () =>
    retry(
      5,
      () =>
        $`eas build:list --platform android --limit 5 --json --non-interactive --status finished --channel production`,
    ),
  )
} catch (err) {
  echo(chalk.red('Failed to get build list.'))
  throw err
}

const buildList = getBuildList(buildListStr)
if (buildList[0].appVersion !== newVersion) {
  throw new Error('EAS latest version is not same as updated version.')
}

await fs.outputFile(
  path.resolve(__dirname, '../docs/version.json'),
  buildList.map(item => {
    return item
    // return {
    //   version: item.appVersion,
    //   changelog: item.gitCommitMessage.split('  '),
    //   date: item.createdAt,
    // }
  }),
)

try {
  await $`rm -rf apk && mkdir -p apk`
  await retry(
    3,
    () =>
      $`wget ${buildList[0].artifacts.buildUrl} -q -O ./apk/minibili-${buildList[0].appVersion}.apk`,
  )
} catch (err) {
  echo(chalk.red('Failed to download latest apk.'))
  throw err
}

try {
  await retry(3, () => $`npm publish --registry=https://registry.npmjs.org/`)
} catch (err) {
  echo(chalk.red('Failed to publish to npm.'))
  throw err
}

try {
  echo('commit to github...')
  await $`git commit -a --amend -C HEAD`
  await spinner('git push...', () => retry(5, () => $`git push`))
  echo(chalk.green('Build done!'))
} catch (err) {
  echo(chalk.red('Failed to push build list to git.'))
  throw err
}

// try {
//   await $`expo-cli publish`
// } catch (err) {
//   echo(chalk.red('Failed to publish sourcemap.'))
//   throw err
// }
