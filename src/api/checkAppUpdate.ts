import useSWR from 'swr'
import * as Application from 'expo-application'
import { changelogUrl } from '../constants'

export const currentVersion = Application.nativeApplicationVersion

interface buildInfo {
  id: string
  status: 'PENDING' | 'FINISHED'
  platform: 'ANDROID' | 'IOS' | 'ALL'
  artifacts: {
    buildUrl: string
    applicationArchiveUrl: string
  }
  initiatingActor: {
    id: string
    displayName: string
  }
  project: {
    id: string
    name: string
    slug: string
    ownerAccount: {
      id: string
      name: string
    }
  }
  releaseChannel: 'production'
  distribution: 'STORE'
  buildProfile: 'production'
  sdkVersion: string
  appVersion: string
  appBuildVersion: string
  gitCommitHash: string
  gitCommitMessage: string
  priority: 'NORMAL'
  createdAt: string
  updatedAt: string
  completedAt: string
  resourceClass: 'ANDROID_MEDIUM'
}

export const checkUpdate = (url = changelogUrl) => {
  return fetch(url + '?_t=' + Date.now())
    .then(r => r.json())
    .then((res: buildInfo[]) => {
      const latestVersion = res[0].appVersion
      const hasUpdate = res[0].appVersion
        ? res[0].appVersion !== currentVersion
        : false
      const downloadLink = res[0].artifacts.applicationArchiveUrl
      const changes = res[0].gitCommitMessage.split('  ')
      return {
        hasUpdate,
        latestVersion,
        downloadLink,
        currentVersion,
        changes,
      }
    })
}

// export function useCheckVersion() {
//   const { data, mutate, isLoading, isValidating, error } = useSWR<{
//     hasUpdate: boolean
//     latestVersion: string
//     downloadLink: string
//     currentVersion: string | null
//     changes: string[]
//   }>(changelogUrl, checkUpdate)

//   return {
//     data,
//     mutate,
//     isLoading,
//     isValidating,
//     error,
//   }
// }
