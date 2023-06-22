import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SWRConfig } from 'swr'
import fetcher from './api/fetcher'
import { Alert, AppState, Linking, Text } from 'react-native'
import { ThemeProvider, createTheme } from '@rneui/themed'
import NetInfo, { useNetInfo } from '@react-native-community/netinfo'
import ButtonsOverlay from './components/ButtonsOverlay'
import CookieProxy from './components/CookieProxy'
import { RootSiblingParent } from 'react-native-root-siblings'
import Route from './routes/Index'
import * as SentryExpo from 'sentry-expo'
import type { FallbackRender } from '@sentry/react'
import store from './store'
import useIsDark from './hooks/useIsDark'
import { showToast } from './utils'
import ThemeResponse from './components/ThemeResponse'
import ImagesView from './components/ImagesView'

const theme = createTheme({
  lightColors: {
    black: '#333',
  },
  darkColors: {
    black: '#bbb',
  },
  mode: 'dark',
})

let online = true
let focus = true
let checkUpdateForError = false

const errorFallback: FallbackRender = errorData => {
  if (!checkUpdateForError) {
    checkUpdateForError = true
    store.appUpdateInfo.then(info => {
      if (info.hasUpdate) {
        Alert.alert(
          '抱歉，应用发生了错误😅',
          '我们会处理这个错误\n\n您当前使用的是旧版应用，推荐您下载新版应用来避免错误',
          [
            {
              text: '下载新版',
              onPress: () => {
                Linking.openURL(info.downloadLink)
              },
            },
          ],
        )
      }
    })
  }
  return (
    <Text style={{ color: 'red', marginVertical: 100, marginHorizontal: 30 }}>
      抱歉，应用发生了错误{'\n'}
      {'\n'}
      {errorData.error?.message}
      {'\n'}
      {'\n'}
      我们会处理这个错误，感谢您的理解和支持
    </Text>
  )
}

export default function App() {
  useIsDark()
  const netInfo = useNetInfo()
  React.useEffect(() => {
    if (netInfo.isConnected === false) {
      setTimeout(() => {
        NetInfo.fetch().then(state => {
          if (!state.isConnected) {
            showToast(' 网络状况不佳 ')
          }
        })
      }, 1000)
    } else {
      if (netInfo.type !== 'wifi' && netInfo.type !== 'unknown') {
        showToast(' 请注意当前网络不是 wifi ')
      }
    }
  }, [netInfo.isConnected, netInfo.type])
  return (
    <SentryExpo.Native.ErrorBoundary fallback={errorFallback}>
      <RootSiblingParent>
        <ThemeProvider theme={theme}>
          <SWRConfig
            value={{
              fetcher,
              errorRetryCount: 2,
              isVisible() {
                return focus
              },
              isOnline() {
                return online
              },
              initFocus(callback) {
                /* 向状态 provider 注册侦听器 */
                let appState = AppState.currentState

                // 订阅 app 状态更改事件
                const subscription = AppState.addEventListener(
                  'change',
                  nextAppState => {
                    online = nextAppState === 'active'
                    /* 如果正在从后台或非 active 模式恢复到 active 模式 */
                    if (appState.match(/inactive|background/) && online) {
                      callback()
                    }
                    appState = nextAppState
                  },
                )

                return () => {
                  subscription.remove()
                }
              },
              initReconnect(callback) {
                /* 向状态 provider 注册侦听器 */
                return NetInfo.addEventListener(state => {
                  if (state.isConnected) {
                    online = true
                    callback()
                  } else {
                    online = false
                  }
                })
              },
            }}>
            <StatusBar style="auto" />
            <ThemeResponse />
            <ButtonsOverlay />
            <CookieProxy />
            <ImagesView />
            <Route />
          </SWRConfig>
        </ThemeProvider>
      </RootSiblingParent>
    </SentryExpo.Native.ErrorBoundary>
  )
}
