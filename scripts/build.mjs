#!/usr/bin/env zx

const { version } = require('../package.json')
const newVersion = await question(`更新版本（${version} -> ?）`)
const semver = require('semver')
if (!semver.valid(newVersion) || semver.lt(newVersion, version)) {
  throw new Error('版本号输入错误')
}
const changes = await question('更新日志（使用双空格分开）')
if (!changes.trim()) {
  throw new Error('更新日志不能为空')
}
await $`npm version ${newVersion} -m ${changes} --allow-same-version`
const { expo } = await fs.readJson(path.resolve(__dirname, '../app.json'))
expo.version = newVersion
expo.ios.buildNumber = newVersion
expo.android.versionCode++
await fs.writeJson(
  path.resolve(__dirname, '../app.json'),
  { expo },
  { spaces: 2 },
)

echo(chalk.cyan('https://expo.dev/accounts/tingyuan/projects/minibili/builds'))

const buildOutput = await spinner('eas building...', () => {
  return $`eas build --platform android --profile production --json --non-interactive`
})

const buildList = await spinner(
  'get eas build list...',
  () => $`eas build:list --platform android --limit 5 --json --non-interactive`,
)

await fs.outputFile(
  path.resolve(__dirname, '../docs/version.json'),
  buildList.toString('utf8').trim(),
)

await $`git commit -a --amend -C HEAD`

await spinner('git push...', () => retry(3, () => $`git push`))

echo(chalk.green('build done!'))
