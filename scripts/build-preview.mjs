#!/usr/bin/env zx
/* globals $, echo, chalk, retry, spinner */

// import { BuildListSchema } from '../src/api/check-update.schema.ts'
const { version } = require('../package.json')

const getBuildList = buildStr => {
  let buildListStr = buildStr.toString('utf8')
  buildListStr = buildListStr.substring(buildListStr.indexOf('['))
  const list = JSON.parse(buildListStr)
  // BuildListSchema.parse(list)
  list.toString = () => buildListStr.trim()
  return list
}

echo(
  chalk.cyan(
    'eas: https://expo.dev/accounts/tingyuan/projects/minibili/builds',
  ),
)

let buildList = []

try {
  await spinner('eas building...', async () => {
    const res =
      await $`eas build --platform android --profile preview --json --non-interactive`
    buildList = getBuildList(res)
  })
} catch (err) {
  echo(chalk.red('Failed to build new apk on EAS.'))
  throw err
}

if (buildList[0].appVersion !== version.split('-')[0]) {
  throw new Error('EAS latest version is not same as updated version.')
}

try {
  await $`rm -rf tmp && mkdir -p tmp`
  await retry(
    3,
    () =>
      $`wget ${buildList[0].artifacts.buildUrl} -q -O ./tmp/minibili-${buildList[0].appVersion}-pre.apk`,
  )
} catch (err) {
  echo(chalk.red('Failed to download latest apk.'))
  throw err
}

try {
  await spinner(
    `installing minibili-${buildList[0].appVersion}-pre.apk`,
    () => $`adb install ./tmp/minibili-${buildList[0].appVersion}-pre.apk`,
  )
} catch (err) {
  echo(chalk.red('Failed to install apk.'))
  throw err
}
