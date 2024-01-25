#!/usr/bin/env zx
/* globals $, question, echo, chalk, fs, path, retry, spinner */
require('dotenv').config()

await $`npx react-native-tailwindcss-build`

const updateOutput =
  await $`npx -y eas-cli@latest update --branch main --json --non-interactive --platform android --message ${'upload sourcemap'}`

const output = updateOutput.toString('utf8')
const updateInfo = JSON.parse(output.substring(output.lastIndexOf('[')))[0]

const bundlesDir = path.join(__dirname, '../dist/bundles')

const files = fs.readdirSync(bundlesDir)
console.log('build paths:', bundlesDir, files)

// const android = files.find(f => f.startsWith('android-') && f.endsWith('.js'))

// fs.renameSync(
//   path.join(bundlesDir, android),
//   path.join(bundlesDir, 'index.android.bundle'),
// )

const androidSourceMap = files.find(
  f => f.startsWith('android-') && f.endsWith('.map'),
)
const appConfig = require('../app.config')
// await $`npx sentry-cli releases \
// files ${appConfig.android.package}@${appConfig.version}+${appConfig.android.versionCode} \
// upload-sourcemaps \
// --dist ${updateInfo.id} \
// --org tingyuan123 \
// --rewrite dist/bundles/${android} dist/bundles/${androidSourceMap}`

await $`npx -y sentry-cli releases --org=tingyuan123 \
files ${appConfig.android.package}@${appConfig.version}+${
  appConfig.android.versionCode
} \
upload-sourcemaps \
--dist=${updateInfo.id} \
--rewrite dist/bundles/index.android.bundle ${
  'dist/bundles/' + androidSourceMap
}
`

echo('Hot update uploaded done')
