import * as Application from 'expo-application'
import React from 'react'
import { Alert, Linking } from 'react-native'

import useAppUpdateInfo from '@/api/check-update'
import { useStore } from '@/store'

export const currentVersion = Application.nativeApplicationVersion!

function CheckAppUpdate() {
  const appUpdateInfo = useAppUpdateInfo()
  const { $checkAppUpdateTime } = useStore()
  const needCheckUpdate =
    $checkAppUpdateTime + 1000 * 60 * 60 * 24 * 3 < Date.now() && !__DEV__

  if (needCheckUpdate && appUpdateInfo.hasUpdate) {
    const latestVersion = appUpdateInfo.latestVersion
    const changelog = appUpdateInfo.changelog
    const downloadLink = appUpdateInfo.downloadLink
    Alert.alert(
      '有新版本',
      [`${currentVersion}  ⟶  ${latestVersion}`, '', changelog].join('\n'),
      [
        {
          text: '取消',
        },
        {
          text: '下载新版',
          onPress: () => {
            if (downloadLink) {
              Linking.openURL(downloadLink)
            }
          },
        },
      ],
    )
  }
  return null
}

export default React.memo(CheckAppUpdate)
