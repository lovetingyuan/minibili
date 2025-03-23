import * as Application from 'expo-application'
import useSWR from 'swr'

import { GhProxy, githubLink } from '@/constants'
import { useStore } from '@/store'

export default function useAppUpdateInfo() {
  const { set$checkAppUpdateTime } = useStore()
  const currentVersion = Application.nativeApplicationVersion!
  const {
    data: list,
    isLoading,
    isValidating,
    error,
    mutate,
  } = useSWR('$check-app-update', () => {
    set$checkAppUpdateTime(Date.now())
    return fetch(
      'https://tingyuan.in/api/github/releases?user=lovetingyuan&repo=minibili',
    )
      .then((r) => r.json())
      .then((r) => {
        if (r.code !== 0) {
          throw new Error(r.code + ':' + r.message)
        }
        return r.data as { version: string; changelog: string }[]
      })
  })

  const latest = list?.[0]
  const latestVersion = latest?.version.split('-')[1]
  return {
    currentVersion,
    hasUpdate: latestVersion ? latestVersion !== currentVersion : false,
    downloadLink: latestVersion
      ? `${GhProxy}/${githubLink}/releases/download/v${latestVersion}/${latest.version}.apk`
      : undefined,
    latestVersion,
    changelog: latest?.changelog,
    changeList: list,
    loading: isLoading || isValidating,
    error,
    checkUpdate: mutate,
  }
}
