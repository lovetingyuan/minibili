#!/usr/bin/env zx

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
await $`npm version ${newVersion} -m ${changes} --no-git-tag-version`
const { expo } = await fs.readJson(path.resolve(__dirname, '../app.json'))
expo.version = newVersion
expo.ios.buildNumber = newVersion
expo.android.versionCode++
await fs.writeJson(
  path.resolve(__dirname, '../app.json'),
  { expo },
  { spaces: 2 },
)

echo('https://expo.dev/accounts/tingyuan/projects/minibili/')
/**
 * [
  {
    "id": "3b3a18ae-e3fa-4b5a-b8e9-c22a848f8cbf",
    "status": "FINISHED",
    "platform": "ANDROID",
    "artifacts": {
      "buildUrl": "https://expo.dev/artifacts/eas/8jbW8US56Y9Mp1Tkx3fRKM.apk",
      "applicationArchiveUrl": "https://expo.dev/artifacts/eas/8jbW8US56Y9Mp1Tkx3fRKM.apk"
    },
    "initiatingActor": {
      "id": "7fe27145-df05-4123-8102-627699be725a",
      "displayName": "tingyuan"
    },
    "project": {
      "id": "17ac07b9-df37-4b3a-9a31-50da2bb5d44c",
      "name": "MiniBili",
      "slug": "minibili",
      "ownerAccount": {
        "id": "5ff38c4f-cd29-466d-94d1-bb863a85a56e",
        "name": "tingyuan"
      }
    },
    "releaseChannel": "production",
    "distribution": "STORE",
    "buildProfile": "production",
    "sdkVersion": "48.0.0",
    "appVersion": "0.0.13",
    "appBuildVersion": "15",
    "gitCommitHash": "972b3700a6a46d9b63355fd4d969599d9be504db",
    "gitCommitMessage": "chore",
    "priority": "NORMAL",
    "createdAt": "2023-04-12T05:03:24.876Z",
    "updatedAt": "2023-04-12T05:12:30.128Z",
    "completedAt": "2023-04-12T05:12:20.925Z",
    "resourceClass": "ANDROID_MEDIUM"
  }
]
 */
const buildOutput = await spinner('eas building...', () => {
  return $`eas build --platform android --profile production --json --non-interactive`
})

const output = await spinner(
  'get eas build list...',
  () => $`eas build:list --platform android --limit 5 --json --non-interactive`,
)
const buildList = JSON.parse(output.toString('utf8').trim())
const latestBuild = buildList[0]
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
  ${buildList
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
  'git commit...',
  () => $`git add . && git commit --amend -C HEAD && git push`,
)
echo(chalk.green('build done!'))
