import React from 'react'
import { Alert, Linking } from 'react-native'

import { useAppUpdateInfo } from '@/api/check-update'

import { useStore } from '../store'

function CheckAppUpdate() {
  const { get$ignoredVersions, set$ignoredVersions } = useStore()
  const appUpdateInfo = useAppUpdateInfo()
  if (appUpdateInfo) {
    const ignoredVersions = get$ignoredVersions()
    const isIgnoredVersion = ignoredVersions.includes(
      appUpdateInfo.latestVersion,
    )
    if (isIgnoredVersion || !appUpdateInfo.hasUpdate) {
      return
    }
    Alert.alert(
      '有新版本',
      [
        `${appUpdateInfo.currentVersion}  ⟶  ${appUpdateInfo.latestVersion}`,
        '',
        ...appUpdateInfo.changelog.split('  '),
      ].join('\n'),
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
          text: '下载新版',
          onPress: () => {
            Linking.openURL(appUpdateInfo.downloadLink)
          },
        },
      ],
    )
  }
  return null
}

export default React.memo(CheckAppUpdate)
