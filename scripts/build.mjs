#!/usr/bin/env zx
/* globals $, question, echo, chalk, fs, path, retry, spinner */

// import { BuildListSchema } from '../src/api/check-update.schema'
const { version } = require('../package.json')
const semver = require('semver')

const getBuildList = buildStr => {
  let buildListStr = buildStr.toString('utf8')
  buildListStr = buildListStr.substring(buildListStr.indexOf('['))
  const list = JSON.parse(buildListStr)
  // BuildListSchema.parse(list)
  list.toString = () => buildListStr.trim()
  return list
}

const latestBuild =
  await $`eas build:list --platform android --limit 1 --json --non-interactive --status finished`
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

await $`npm version ${newVersion}-${
  Number(appBuildVersion) + 1
} -m ${changes} --allow-same-version`

echo(
  chalk.cyan(
    'eas: https://expo.dev/accounts/tingyuan/projects/minibili/builds',
  ),
)

try {
  await spinner('eas building...', () => {
    return $`eas build --platform android --profile production --json --non-interactive`
  })
} catch (err) {
  await $`git checkout -- .`
  await $`npm version ${version} -m "failed to publish ${newVersion}" --allow-same-version`
  echo(chalk.red('Failed to build new apk on EAS.'))
  throw err
}
let buildListStr = ''

await new Promise(r => {
  setTimeout(r, 5000)
})

try {
  buildListStr = await spinner('get eas build list...', () =>
    retry(
      5,
      () =>
        $`eas build:list --platform android --limit 5 --json --non-interactive --status finished`,
    ),
  )
} catch (err) {
  echo(chalk.red('Failed to get build list.'))
  throw err
}

const buildList = getBuildList(buildListStr)
try {
  await fs.outputFile(
    path.resolve(__dirname, '../docs/version.json'),
    buildList,
  )

  await $`git commit -a --amend -C HEAD`

  await spinner('git push...', () => retry(5, () => $`git push`))

  echo(chalk.green('Build done!'))
} catch (err) {
  echo(chalk.red('Failed to push build list to git.'))
  throw err
}

try {
  await $`wget ${buildList[0].artifacts.buildUrl} -q -O ./dist/minibili-${buildList[0].appVersion}.apk`
} catch (err) {
  echo(chalk.red('Failed to download apk.'))
  throw err
}

try {
  await $`npm publish`
} catch (err) {
  echo(chalk.red('Failed to publish to npm.'))
  throw err
}

try {
  await $`expo publish`
} catch (err) {
  echo(chalk.red('Failed to publish sourcemap.'))
  throw err
}
