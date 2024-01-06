import './sentry'
import * as SentryExpo from 'sentry-expo'
import { Linking, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { showFatalError, showToast, delay } from './utils'
import { getRemoteConfig } from './api/get-config'
import Constants from 'expo-constants'
import { Tags, reportUserOpenApp } from './utils/report'

async function init() {
  reportUserOpenApp()
  const gitHash = Constants.expoConfig?.extra?.gitHash
  if (gitHash) {
    SentryExpo.Native.setTag(Tags.git_hash, gitHash)
  }
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
            '欢迎使用极简版B站，没有推荐，没有广告，只是简单的浏览',
            '\n',
            '注：如果遇到闪退或报错请及时更新版本',
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
            onDismiss: () =>
              r(AsyncStorage.setItem('FIRST_RUN', Date.now() + '')),
          },
        )
      } else {
        r(null)
      }
    })
  })

  await getRemoteConfig().then(config => {
    if (!config.statement.show) {
      return
    }
    return new Promise(r => {
      Alert.alert(
        config.statement.title,
        config.statement.content,
        [
          {
            text: config.statement.url ? '详情' : '确定',
            onPress: () => {
              if (config.statement.url) {
                Linking.openURL(config.statement.url)
              }
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
  })
}

init()
