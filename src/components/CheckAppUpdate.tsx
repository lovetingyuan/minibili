import React from 'react'
import { Alert, Linking } from 'react-native'
import { getAppUpdateInfo, useStore } from '../store'

export default React.memo(function CheckAppUpdate() {
  const { get$ignoredVersions, set$ignoredVersions } = useStore()
  React.useEffect(() => {
    getAppUpdateInfo.then(appUpdateInfo => {
      const ignoredVersions = get$ignoredVersions()
      const isIgnoredVersion = ignoredVersions.includes(
        appUpdateInfo.latestVersion,
      )
      if (isIgnoredVersion || !appUpdateInfo.hasUpdate) {
        return
      }
      Alert.alert(
        '有新版本',
        `${appUpdateInfo.currentVersion}  ⟶  ${appUpdateInfo.latestVersion}`,
        [
          {
            text: '取消',
          },
          {
            text: '忽略',
            onPress: () => {
              set$ignoredVersions([
                ...ignoredVersions,
                appUpdateInfo.latestVersion,
              ])
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
  }, [])
  return null
})
