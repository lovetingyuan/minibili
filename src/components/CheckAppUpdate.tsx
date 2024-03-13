import React from 'react'
import { Alert, Linking } from 'react-native'

import { useAppUpdateInfo } from '@/api/check-update'

function CheckAppUpdate() {
  const appUpdateInfo = useAppUpdateInfo()
  if (appUpdateInfo?.hasUpdate && !__DEV__) {
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
        // {
        //   text: '忽略',
        //   onPress: () => {
        //     set$ignoredVersions(
        //       ignoredVersions.concat(appUpdateInfo.latestVersion),
        //     )
        //   },
        // },
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
