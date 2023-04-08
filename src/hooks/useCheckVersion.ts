import useSWR from 'swr'
import * as Application from 'expo-application'
import { changelogUrl } from '../constants'

const version = Application.nativeApplicationVersion

export function useCheckVersion() {
  const {
    data: changelog,
    mutate,
    isLoading,
    error,
  } = useSWR<{
    downloadLink: string
    changelog: { version: string; changes: string[] }[]
  }>(changelogUrl, url => {
    return fetch(url).then(r => r.json())
  })
  const latestVersion = changelog?.changelog[0].version
  const hasUpdate = latestVersion && latestVersion !== version
  const downloadLink = changelog?.downloadLink
  return {
    data: {
      latestVersion,
      hasUpdate, //: __DEV__ ? false : hasUpdate,
      currentVersion: version,
      downloadLink,
    },
    mutate,
    isLoading,
    error,
  }
}
