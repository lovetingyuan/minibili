import useSWR from 'swr'
import * as Application from 'expo-application'
import { changelogUrl } from '../constants'

export const currentVersion = Application.nativeApplicationVersion

export const checkUpdate = (url = changelogUrl) => {
  return fetch(url)
    .then(r => r.json())
    .then(
      (res: {
        downloadLink: string
        changelog: { version: string; changes: string[] }[]
      }) => {
        const latestVersion = res?.changelog[0].version
        const hasUpdate = latestVersion
          ? latestVersion !== currentVersion
          : false
        const downloadLink = res?.downloadLink
        return {
          hasUpdate,
          latestVersion,
          downloadLink,
          currentVersion,
          changes: res.changelog[0].changes,
        }
      },
    )
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
