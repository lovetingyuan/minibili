import './sentry'
import * as SentryExpo from 'sentry-expo'
import { Linking, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import store from './store'
import { showFatalError, showToast } from './utils'
import { getRemoteConfig } from './api/get-config'

async function init() {
  if (typeof ErrorUtils === 'object') {
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      SentryExpo.Native.captureException(error)
      if (!isFatal) {
        showToast('发生了未知错误')
        return
      }
      showFatalError()
    })
  }
  await new Promise(r => {
    AsyncStorage.getItem('FIRST_RUN').then(res => {
      if (!res) {
        Alert.alert(
          '使用说明',
          [
            '本App为简易版B站，所有数据均为官方公开，切勿频繁刷新',
            '如果遇到闪退情况，请及时更新版本',
          ].join('\n'),
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
      )
    })
  }
  await getRemoteConfig()
    .then(config => {
      if (config.statement.show) {
        return new Promise(r => {
          Alert.alert(
            config.statement.title,
            config.statement.content,
            [
              {
                text: '确定',
                onPress: () => {
                  r(null)
                },
              },
            ],
            {
              cancelable: config.statement.dismiss,
              onDismiss: () => r(null),
            },
          )
        })
      }
    })
    .catch(() => {})
}

init()
