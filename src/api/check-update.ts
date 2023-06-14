import * as Application from 'expo-application'
// import { changelogUrl } from '../constants'

export const currentVersion = Application.nativeApplicationVersion

// interface BuildInfo {
//   id: string
//   status: 'PENDING' | 'FINISHED'
//   platform: 'ANDROID' | 'IOS' | 'ALL'
//   artifacts: {
//     buildUrl: string
//     applicationArchiveUrl: string
//   }
//   initiatingActor: {
//     id: string
//     displayName: string
//   }
//   project: {
//     id: string
//     name: string
//     slug: string
//     ownerAccount: {
//       id: string
//       name: string
//     }
//   }
//   releaseChannel: 'production'
//   distribution: 'STORE'
//   buildProfile: 'production'
//   sdkVersion: string
//   appVersion: string
//   appBuildVersion: string
//   gitCommitHash: string
//   gitCommitMessage: string
//   priority: 'NORMAL'
//   createdAt: string
//   updatedAt: string
//   completedAt: string
//   resourceClass: 'ANDROID_MEDIUM'
// }

export const checkUpdate = () => {
  return fetch('https://unpkg.com/minibili/package.json?_t=' + Date.now())
    .then(r => r.json())
    .then((res: { name: string; version: string }) => {
      const latestVersion = res.version.split('-')[0]
      // const latestVersion = res[0].appVersion
      const hasUpdate = latestVersion !== currentVersion
      const downloadLink = `https://unpkg.com/minibili@${res.version}/apk/minibili-${latestVersion}.apk`
      return {
        hasUpdate,
        latestVersion,
        downloadLink,
        currentVersion,
      }
    })
}
