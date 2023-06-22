import './sentry'
// import * as SplashScreen from 'expo-splash-screen'
import { Linking, Alert } from 'react-native'
// import { currentVersion } from './api/check-update'
import AsyncStorage from '@react-native-async-storage/async-storage'
import store from './store'
import { subscribeKey } from 'valtio/utils'
import { checkLivingUps } from './api/living-info'
// import { checkUpdateUps, upUpdateQueue } from './api/dynamic-items'

// SplashScreen.preventAutoHideAsync()

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
                r(AsyncStorage.setItem('FIRST_RUN', Date.now() + ''))
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
  // const remoteConfig = await store.remoteConfig
  // let isBroken = false
  // if (currentVersion && remoteConfig.brokenVersions.includes(currentVersion)) {
  //   isBroken = true
  //   await new Promise(r => {
  //     Alert.alert(
  //       '注意',
  //       '当前版本存在问题，请更新APP后使用',
  //       [
  //         {
  //           text: '确定',
  //           onPress: () => {
  //             r(null)
  //           },
  //         },
  //       ],
  //       {
  //         onDismiss: () => r(null),
  //       },
  //     )
  //   })
  // }
  // if (remoteConfig.statement.show) {
  //   await new Promise(r => {
  //     Alert.alert(
  //       remoteConfig.statement.title,
  //       remoteConfig.statement.content,
  //       [
  //         {
  //           text: '确定',
  //           onPress: () => {
  //             r(null)
  //           },
  //         },
  //       ],
  //       {
  //         cancelable: remoteConfig.statement.dismiss,
  //         onDismiss: () => r(null),
  //       },
  //     )
  //   })
  // }
  const appUpdateInfo = await store.appUpdateInfo
  const isIgnoredVersion = store.$ignoredVersions.includes(
    appUpdateInfo.latestVersion,
  )
  if (appUpdateInfo.hasUpdate && !isIgnoredVersion) {
    const isBigUpdate =
      appUpdateInfo.currentVersion?.split('.')[0] !==
      appUpdateInfo.latestVersion.split('.')[0]
    await new Promise(r => {
      Alert.alert(
        '有新版本' + (isBigUpdate ? '（建议更新 🎉）' : ''),
        `${appUpdateInfo.currentVersion} ⟶ ${appUpdateInfo.latestVersion}`,
        [
          {
            text: '取消',
          },
          {
            text: '忽略',
            onPress: () => {
              store.$ignoredVersions.push(appUpdateInfo.latestVersion!)
              r(null)
            },
          },
          {
            text: '下载更新',
            onPress: () => {
              r(null)
              Linking.openURL(appUpdateInfo.downloadLink)
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

/**
 * 1 如果是未登录则不检查
 * 2 如果关注为空则不检查
 * 3 如果关注发生变化，则立即重新检查
 */
let checkLivingTimer: number | null = null

subscribeKey(store, '$followedUps' as const, () => {
  if (!store.initialed) {
    return
  }
  if (typeof checkLivingTimer === 'number') {
    clearInterval(checkLivingTimer)
  }
  checkLivingUps()
  checkLivingTimer = window.setInterval(() => {
    checkLivingUps()
  }, 10 * 60 * 1000)
})

init()
