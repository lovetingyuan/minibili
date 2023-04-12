#!/usr/bin/env zx

if (argv.pre) {
  const { version } = require('../package.json')
  const newVersion = await question(`更新版本（${version} -> ?）`)
  const semver = require('semver')
  if (!semver.valid(newVersion) || !semver.gt(newVersion, version)) {
    throw new Error('版本号输入错误')
  }
  const changes = await question('更新日志（使用双空格分开）')
  if (!changes.trim()) {
    throw new Error('更新日志不能为空')
  }
  await $`npm version ${newVersion} -m ${changes}`
  const { expo } = await fs.readJson(path.resolve(__dirname, '../app.json'))
  expo.version = answers.version
  expo.ios.buildNumber = answers.version
  expo.android.versionCode++
  await fs.writeJson(path.resolve(__dirname, '../app.json'), { expo })
} else if (argv.post) {
  const output = await spinner(
    () =>
      $`eas build:list --platform android --limit 5 --json --non-interactive`,
  )
  const changes = JSON.parse(output.toString('utf8').trim())
  const latestBuild = changes[0]
  const { Window } = require('happy-dom')

  const { document } = new Window({
    url: 'http://localhost',
    settings: {
      disableJavaScriptEvaluation: true,
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
      disableIframePageLoading: true,
      enableFileSystemHttpRequests: false,
    },
  })
  const htmlFile = path.resolve(__dirname, '../docs/index.html')
  document.write(fs.readFileSync(htmlFile, 'utf8'))
  document.getElementById('changelog').innerHTML = `
  ${changes
    .map(change => {
      const apkUrl = change.artifacts.applicationArchiveUrl
      const updateMessage = change.gitCommitMessage.split('  ')
      const buildDate = change.completedAt.split('T')[0]
      const version = change.appVersion
      return `
    <h4><a href="${apkUrl}" target="_blank">${version}</a> (${buildDate})</h4>
    <ul>
      ${updateMessage
        .map(msg => {
          return `<li>${msg}</li>`
        })
        .join('\n')}
      </ul>`
    })
    .join('\n')}
  `
  document.getElementById('download-btn').href = latestBuild.apkUrl
  await fs.outputFile(htmlFile, document.documentElement.outerHTML)
  await spinner(
    'commit docs...',
    () =>
      $`git add . && git commit -m "release: v${latestBuild.appVersion}" && git push`,
  )
  echo(chalk.green('build done!'))
}
