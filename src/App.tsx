import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SWRConfig } from 'swr'
import fetcher from './api/fetcher'
import { AppState, Linking, Text, Appearance } from 'react-native'
import { ThemeProvider, createTheme } from '@rneui/themed'
import NetInfo, { useNetInfo } from '@react-native-community/netinfo'
import ButtonsOverlay from './components/ButtonsOverlay'
import CookieProxy from './components/CookieProxy'
import { RootSiblingParent } from 'react-native-root-siblings'
import Route from './routes/Index'
import * as SentryExpo from 'sentry-expo'
import type { FallbackRender } from '@sentry/react'
import store from './store'
import { showFatalError, showToast } from './utils'
import ThemeResponse from './components/ThemeResponse'
import ImagesView from './components/ImagesView'
import { subscribeKey } from 'valtio/utils'
import { checkLivingUps } from './api/living-info'
import { site } from './constants'

/**
 * 1 如果是未登录则不检查
 * 2 如果关注为空则不检查
 * 3 如果关注发生变化，则立即重新检查
 */
let checkLivingTimer: number | null = null

subscribeKey(store, '$followedUps' as const, () => {
  // if (!store.initialed) {
  //   return
  // }
  if (typeof checkLivingTimer === 'number') {
    clearInterval(checkLivingTimer)
  }
  checkLivingUps()
  checkLivingTimer = window.setInterval(() => {
    checkLivingUps()
  }, 9 * 60 * 1000)
})

const theme = createTheme({
  lightColors: {
    black: '#333',
    grey5: '#ddd',
  },
  darkColors: {
    black: '#bbb',
    grey5: '#181818',
  },
  mode: Appearance.getColorScheme() || 'light',
})

let online = true
let focus = true
let checkUpdateForError = false

const errorFallback: FallbackRender = errorData => {
  if (!checkUpdateForError) {
    checkUpdateForError = true
    showFatalError()
  }
  return (
    <Text
      style={{
        color: 'red',
        marginVertical: 100,
        marginHorizontal: 30,
        fontSize: 16,
      }}>
      抱歉，应用发生了未知错误{'\n'}
      {'\n'}
      {errorData.error?.message}
      {'\n'}
      {'\n'}
      我们会处理这个错误，感谢您的理解和支持
      {'\n'}
      您可以在此
      <Text
        style={{ color: '#0070C6' }}
        onPress={() => {
          Linking.openURL(site)
        }}>
        下载最新版本
      </Text>
    </Text>
  )
}

export default function App() {
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
