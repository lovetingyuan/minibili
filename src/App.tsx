// import './global.css'

import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SWRConfig } from 'swr'
import fetcher from './api/fetcher'
import { AppState, View } from 'react-native'
import { ThemeProvider, createTheme } from '@rneui/themed'
import NetInfo from '@react-native-community/netinfo'
import ButtonsOverlay from './components/ButtonsOverlay'
import { RootSiblingParent } from 'react-native-root-siblings'
import Route from './routes/Index'
import * as SentryExpo from 'sentry-expo'
import type { FallbackRender } from '@sentry/react'
import ThemeResponse from './components/ThemeResponse'
import ImagesView from './components/ImagesView'
import type { ProviderConfiguration, SWRConfiguration } from 'swr/_internal'
import ErrorFallback from './components/ErrorFallback'
import useIsDark from './hooks/useIsDark'

let online = true
let focus = true

const errorFallback: FallbackRender = errorData => {
  return <ErrorFallback message={errorData.error.message} />
}

export default function App() {
  const dark = useIsDark()
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
  const containerStyle = React.useMemo(() => {
    return { backgroundColor: dark ? 'black' : 'white', flex: 1 }
  }, [dark])
  const theme = React.useMemo(() => {
    return createTheme({
      lightColors: {
        black: '#333',
        grey5: '#ddd',
      },
      darkColors: {
        black: '#bbb',
        grey5: '#181818',
      },
      mode: dark ? 'dark' : 'light',
    })
  }, [dark])
  return (
    <SentryExpo.Native.ErrorBoundary fallback={errorFallback}>
      <RootSiblingParent>
        <ThemeProvider theme={theme}>
          <ThemeResponse />
          <SWRConfig value={swrConfig}>
            <View style={containerStyle}>
              <StatusBar style="auto" />
              <ButtonsOverlay />
              <ImagesView />
              <Route />
            </View>
          </SWRConfig>
        </ThemeProvider>
      </RootSiblingParent>
    </SentryExpo.Native.ErrorBoundary>
  )
}
