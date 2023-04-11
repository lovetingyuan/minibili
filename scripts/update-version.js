const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')

if (process.argv.includes('--pre')) {
  console.log();
  console.log('Do not forget to bump version')
  console.log();

  const { version } = require('../package.json')
  const appJsonFile = require.resolve('../app.json')
  const { expo } = require(appJsonFile)
  expo.version = version
  expo.ios.buildNumber = version
  expo.android.versionCode++

  fs.writeFileSync(appJsonFile, JSON.stringify({ expo }, null, 2))

} else if (process.argv.includes('--post')) {
  const output = childProcess.execSync('eas build:list --platform android --limit 5 --json --non-interactive')
  const changes = JSON.parse(output.toString('utf8').trim())
  const latestBuild = (changes[0]);
  const { Window } = require('happy-dom');

  const window = new Window({
    url: 'http://localhost',
    settings: {
      disableJavaScriptEvaluation: true,
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
      disableIframePageLoading: true,
      enableFileSystemHttpRequests: false
    }
  });
  const document = window.document;
  const htmlFile = path.resolve(__dirname, '../docs/index.html')
  document.write(fs.readFileSync(htmlFile, 'utf8'))
  const changelogDom = document.getElementById('changelog')
  changelogDom.innerHTML = `
  ${changes.map(change => {
    const apkUrl = change.artifacts.applicationArchiveUrl
    const updateMessage = change.gitCommitMessage.split('  ')
    const buildDate = change.completedAt.split('T')[0]
    const version = change.appVersion
    return `
    <h4><a href="${apkUrl}" target="_blank">${version}</a> (${buildDate})</h4>
    <ul>
      ${updateMessage.map(msg => {
      return `<li>${msg}</li>`
    }).join('\n')}
      </ul>`
  }).join('\n')
    }
  `
  document.getElementById('download-btn').href = latestBuild.apkUrl
  const outputHtml = document.documentElement.outerHTML
  fs.writeFileSync(htmlFile, outputHtml)
}
