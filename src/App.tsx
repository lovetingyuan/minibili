import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SWRConfig } from 'swr'
import fetcher from './api/fetcher'
import { AppState, Linking, Text, Button, View, Appearance } from 'react-native'
import { ThemeProvider, createTheme } from '@rneui/themed'
import NetInfo, { useNetInfo } from '@react-native-community/netinfo'
import ButtonsOverlay from './components/ButtonsOverlay'
import CookieProxy from './components/CookieProxy'
import { RootSiblingParent } from 'react-native-root-siblings'
import Route from './routes/Index'
import * as SentryExpo from 'sentry-expo'
import type { FallbackRender } from '@sentry/react'
import { showFatalError, showToast } from './utils'
import ThemeResponse from './components/ThemeResponse'
import ImagesView from './components/ImagesView'
import { site } from './constants'
import MyImage from './components/MyImage'
import type { ProviderConfiguration, SWRConfiguration } from 'swr/_internal'

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
let showErrorAlert = false

const errorFallback: FallbackRender = errorData => {
  if (!showErrorAlert) {
    showErrorAlert = true
    showFatalError()
  }
  return (
    <View>
      <StatusBar style="auto" />
      <MyImage source={require('../assets/error.png')} widthScale={0.8} />
      <Text
        style={{
          color: 'red',
          marginHorizontal: 30,
          fontSize: 16,
        }}>
        非常抱歉，应用发生了未知错误
        {'\n\n'}
        {errorData.error?.message}
        {'\n\n'}
        我们会处理这个错误，感谢您的理解和支持
        {'\n\n'}
        您可以退出应用并重新打开{'\n'}我们推荐您
        <Button
          title="下载最新版本"
          onPress={() => {
            Linking.openURL(site)
          }}
        />
      </Text>
    </View>
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
  const swrConfig = React.useMemo<
    SWRConfiguration & Partial<ProviderConfiguration>
  >(() => {
    return {
      fetcher,
      errorRetryCount: 4,
      as: 8,
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
    }
  }, [])
  return (
    <SentryExpo.Native.ErrorBoundary fallback={errorFallback}>
      <RootSiblingParent>
        <ThemeProvider theme={theme}>
          <SWRConfig value={swrConfig}>
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
