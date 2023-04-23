import './sentry'
import * as SplashScreen from 'expo-splash-screen'
import { Linking, Alert, BackHandler } from 'react-native'
import { checkUpdate } from './api/check-update'
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import store from './store'
import { getRemoteConfig } from './api/get-config'

SplashScreen.preventAutoHideAsync()

new Promise(r => {
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
  .then(() => {
    return new Promise(resolve => {
      getRemoteConfig().then(config => {
        if (!config.statement.show) {
          resolve(null)
          return
        }
        Alert.alert(
          config.statement.title,
          config.statement.content,
          [
            {
              text: '确定',
              onPress: () => {
                if (config.statement.exit) {
                  BackHandler.exitApp()
                }
                resolve(null)
              },
            },
          ],
          {
            cancelable: config.statement.cancel,
          },
        )
      })
    })
  })
  .then(() => {
    let checkedUpdate = false
    let checking = false
    NetInfo.addEventListener(state => {
      if (state.isConnected && !checkedUpdate && !checking) {
        checking = true
        checkUpdate()
          .then(data => {
            checkedUpdate = true
            checking = false
            if (!data.hasUpdate) {
              return
            }
            if (store.$ignoredVersions.includes(data.latestVersion)) {
              return
            }
            const forceUpdate = data.changes.some(v => v.includes('[force]'))
            Alert.alert(
              '有新版本',
              `${data.currentVersion} --> ${
                data.latestVersion
              }\n\n${data.changes.join('\n').replace('[force]', '')}`,
              forceUpdate
                ? [
                    {
                      text: '下载更新',
                      onPress: () => {
                        Linking.openURL(data.downloadLink!)
                      },
                    },
                  ]
                : [
                    {
                      text: '取消',
                    },
                    {
                      text: '忽略',
                      onPress: () => {
                        if (
                          !store.$ignoredVersions.includes(data.latestVersion)
                        ) {
                          store.$ignoredVersions.push(data.latestVersion!)
                        }
                      },
                    },
                    {
                      text: '下载更新',
                      onPress: () => {
                        Linking.openURL(data.downloadLink!)
                      },
                    },
                  ],
              {
                cancelable: forceUpdate ? false : true,
              },
            )
          })
          .catch(() => {
            checking = false
          })
      }
    })
  })
