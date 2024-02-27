import React from 'react'
import { Alert, Linking } from 'react-native'

import { checkUpdate } from '@/api/check-update'
import useMounted from '@/hooks/useMounted'

import { useStore } from '../store'

function CheckAppUpdate() {
  const { get$ignoredVersions, set$ignoredVersions } = useStore()
  useMounted(() => {
    if (__DEV__) {
      return
    }
    checkUpdate().then(appUpdateInfo => {
      const ignoredVersions = get$ignoredVersions()
      const isIgnoredVersion = ignoredVersions.includes(
        appUpdateInfo.latestVersion,
      )
      if (isIgnoredVersion || !appUpdateInfo.hasUpdate) {
        return
      }
      Alert.alert(
        '有新版本',
        `${appUpdateInfo.currentVersion}  ⟶  ${appUpdateInfo.latestVersion}\n\n${appUpdateInfo.changelog}`,
        [
          {
            text: '取消',
          },
          {
            text: '忽略',
            onPress: () => {
              set$ignoredVersions(
                ignoredVersions.concat(appUpdateInfo.latestVersion),
              )
            },
          },
          {
            text: '下载更新',
            onPress: () => {
              Linking.openURL(appUpdateInfo.downloadLink)
            },
          },
        ],
      )
    })
  })
  return null
}

export default React.memo(CheckAppUpdate)
