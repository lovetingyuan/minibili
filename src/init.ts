import './sentry'
import * as SplashScreen from 'expo-splash-screen'
import { Linking, Alert } from 'react-native'
import { currentVersion } from './api/check-update'
import AsyncStorage from '@react-native-async-storage/async-storage'
import store from './store'

SplashScreen.preventAutoHideAsync()

async function init() {
  await new Promise(r => {
    AsyncStorage.getItem('FIRST_RUN').then(res => {
      if (!res) {
        Alert.alert(
          '使用说明',
          '本App为简易版B站，所有数据均为官方公开，切勿频繁刷新',
          [
            {
              text: '确定',
              onPress: () => {
                r(AsyncStorage.setItem('FIRST_RUN', 'false'))
              },
            },
          ],
          {
            cancelable: false,
          },
        )
      } else {
        r(null)
      }
    })
  })
  const remoteConfig = await store.remoteConfig
  let isBroken = false
  if (currentVersion && remoteConfig.brokenVersions.includes(currentVersion)) {
    isBroken = true
    await new Promise(r => {
      Alert.alert(
        '注意',
        '当前版本存在问题，请更新APP后使用',
        [
          {
            text: '确定',
            onPress: () => {
              r(null)
            },
          },
        ],
        {
          onDismiss: () => r(null),
        },
      )
    })
  }
  if (remoteConfig.statement.show) {
    await new Promise(r => {
      Alert.alert(
        remoteConfig.statement.title,
        remoteConfig.statement.content,
        [
          {
            text: '确定',
            onPress: () => {
              r(null)
            },
          },
        ],
        {
          cancelable: remoteConfig.statement.dismiss,
          onDismiss: () => r(null),
        },
      )
    })
  }
  const updateInfo = await store.updateInfo
  const isIgnoredVersion = store.$ignoredVersions.includes(
    updateInfo.latestVersion,
  )
  if (updateInfo.hasUpdate) {
    if (isBroken || !isIgnoredVersion) {
      await new Promise(r => {
        Alert.alert(
          '有新版本',
          `${updateInfo.currentVersion} --> ${
            updateInfo.latestVersion
          }\n\n${updateInfo.changes.join('\n').replace('[force]', '')}`,
          [
            {
              text: '取消',
            },
            {
              text: '忽略',
              onPress: () => {
                r(null)
                store.$ignoredVersions.push(updateInfo.latestVersion!)
              },
            },
            {
              text: '下载更新',
              onPress: () => {
                r(null)
                Linking.openURL(updateInfo.downloadLink!)
              },
            },
          ],
          {
            onDismiss: () => r(null),
          },
          // {
          //   cancelable: isBroken ? false : true,
          // },
        )
      })
    }
  }
}

init()
