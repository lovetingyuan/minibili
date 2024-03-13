import * as Application from 'expo-application'
import React from 'react'

import useMounted from '@/hooks/useMounted'

export const currentVersion = Application.nativeApplicationVersion!

export const checkUpdate = () => {
  return fetch('https://unpkg.com/minibili/package.json?_t=' + Date.now())
    .then(r => r.json())
    .then(
      (res: {
        name: string
        version: string
        config: { changelog: string; versionCode: number }
      }) => {
        const latestVersion = res.version
        // const latestVersion = res[0].appVersion
        const hasUpdate = latestVersion !== currentVersion
        const downloadLink = `https://unpkg.com/minibili@${res.version}/apk/minibili-${latestVersion}.apk`
        return {
          hasUpdate,
          latestVersion,
          downloadLink,
          currentVersion,
          changelog: res.config.changelog,
        }
      },
    )
}
type PT<V> = V extends Promise<infer T> ? T : never

export const useAppUpdateInfo = () => {
  const [appUpdateInfo, setAppUpdateInfo] = React.useState<PT<
    ReturnType<typeof checkUpdate>
  > | null>(null)
  useMounted(() => {
    if (appUpdateInfo) {
      return
    }
    checkUpdate().then(setAppUpdateInfo)
  })
  return appUpdateInfo
}
