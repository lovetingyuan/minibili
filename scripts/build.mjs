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
  console.log(22, buildListStr)
  const list = JSON.parse(buildListStr)
  // BuildListSchema.parse(list)
  list.toString = () => buildListStr.trim()
  return list
}

$.verbose = false

// echo(chalk.blue('checking env...'))
await spinner('Checking build env...', async () => {
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

  await $`npm ping`
  const npmuser = await $`npm whoami --registry=https://registry.npmjs.org/`
  assert.ok(
    npmuser && npmuser.toString('utf8').trim().length > 0,
    chalk.red('npm user not login.'),
  )

  const easuser = await $`npx --yes eas-cli@latest whoami`
  assert.ok(
    easuser && easuser.toString('utf8').trim().length > 0,
    chalk.red('EAS cli not login.'),
  )

  await retry(
    3,
    () => $`git ls-remote --heads https://github.com/lovetingyuan/minibili.git`,
  )
  // await $`git ls-remote --heads https://github.com/lovetingyuan/minibili.git`

  const branch = await $`git rev-parse --abbrev-ref HEAD`
  assert.equal(
    branch.toString('utf8').trim(),
    'main',
    chalk.red('Current branch is not main'),
  )
  await $`git push`
})

echo(chalk.green('Environment is all right.\n'))

let appVersion

await spinner('Checking current build list...', async () => {
  const currentBuild =
    await $`npx -y eas-cli@latest build:list --platform android --limit 1 --json --non-interactive --status finished --channel production`
  appVersion = getBuildList(currentBuild)[0].appVersion
  if (appVersion !== version) {
    throw new Error(
      `Package version ${version} is not same as the latest build version ${appVersion}`,
    )
  }
})

await $`npx react-native-tailwindcss-build`

// -------------------------------------------

const newVersion = await question(`更新版本（${appVersion} -> ?）`)

if (!semver.valid(newVersion) || semver.lt(newVersion, appVersion)) {
  throw new Error('版本号输入错误')
}

const changes = await question('更新日志（使用双空格分开）')
if (!changes.trim()) {
  throw new Error('更新日志不能为空')
}

if (newVersion !== pkg.version) {
  pkg.config.versionCode++
  pkg.version = newVersion
}
pkg.config.changelog = changes
const commitHash = (await $`git rev-parse --short HEAD`).toString('utf8').trim()
pkg.gitHead = commitHash

fs.outputJsonSync(pkgPath, pkg, {
  spaces: 2,
})

echo(
  chalk.cyan(
    'EAS building: https://expo.dev/accounts/tingyuan/projects/minibili/builds',
  ),
)

let latestBuildList

try {
  await spinner('EAS building...', async () => {
    await $`npx -y eas-cli@latest build --platform android --profile production --message ${changes} --json --non-interactive`
    return new Promise(r => setTimeout(r, 1000))
  })
  let buildListStr = ''
  echo(chalk.green('EAS build done.'))

  try {
    buildListStr = await spinner('Checking EAS build list...', () =>
      retry(
        3,
        () =>
          $`npx -y eas-cli@latest build:list --platform android --limit 5 --json --non-interactive --status finished --channel production`,
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
  echo(chalk.green('EAS build success.'))
} catch (err) {
  await $`git checkout -- .`
  // await $`npm version ${version} -m "failed to publish ${newVersion}" --allow-same-version`
  echo(chalk.red('Failed to build new apk on EAS.'))
  throw err
}

// ---------------------------------------------
echo(chalk.blue('Update version file...'))
await fs.outputJsonSync(
  path.resolve(__dirname, '../docs/version.json'),
  latestBuildList.map(item => {
    return {
      version: item.appVersion,
      changelog: (item.message || item.gitCommitMessage).split('  '),
      date: item.createdAt,
    }
  }),
  {
    spaces: 2,
  },
)

const apkUrl = latestBuildList[0].artifacts.buildUrl
echo(chalk.blue('download apk file...'))

try {
  await spinner('Downloading APK file...', async () => {
    await $`npx rimraf apk`
    await $`mkdir apk`
    return retry(3, () => {
      return $`npx download --out apk ${apkUrl} --filename minibili-${newVersion}.apk`
    })
  })
  echo(chalk.blue(`Saved apk to ./apk/minibili-${newVersion}.apk`))
  try {
    await $`du -h apk/minibili-${newVersion}.apk`
  } catch (e) {}
} catch (err) {
  echo(chalk.red('Failed to download latest apk.'))
  echo(`wget ${apkUrl} -q -O ./apk/minibili-${newVersion}.apk`)
  throw err
}

try {
  await spinner('Publish to npm...', () =>
    retry(
      3,
      () => $`npm publish --tag beta --registry=https://registry.npmjs.org/`,
    ),
  )
  echo(chalk.blue('published as beta tag to npm success.'))
} catch (err) {
  echo(chalk.red('Failed to publish to npm.'))
  echo('npm publish --tag beta --registry=https://registry.npmjs.org/')
  throw err
}

try {
  const message = `release(v${newVersion}): ${changes}`
  await spinner('git push change...', async () => {
    await $`git commit -am ${message}`
    return retry(5, () => $`git push`)
  })
  echo(chalk.green('git push commit done.'))
} catch (err) {
  echo(chalk.red('Failed to publish to github.'))
  echo('git push')
  throw err
}

try {
  await spinner('git push tag...', async () => {
    await $`git tag -a v${newVersion} -m ${changes}`
    return retry(5, () => $`git push origin v${newVersion}`)
  })
  echo(chalk.green('git push tags done.'))
} catch (err) {
  echo(chalk.red('Failed to push tags to git.'))
  echo(`git push origin v${newVersion}`)
  throw err
}

echo(
  chalk.green(
    'Build done, please test your app and set npm tag to latest to publish new version finally!',
  ),
)

echo(
  `npm dist-tag add ${pkg.name}@${newVersion} latest --registry=https://registry.npmjs.org/`,
)
const open = require('open')
open(
  `https://github.com/lovetingyuan/minibili/releases/new?tag=v${newVersion}&title=minibili-${newVersion}&body=${encodeURIComponent(
    changes
      .split('  ')
      .map(c => `- ${c}`)
      .join('\n'),
  )}`,
)
