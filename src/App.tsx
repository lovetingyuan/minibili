import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SWRConfig } from 'swr'
import fetcher from './api/fetcher'
import { AppState } from 'react-native'
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
import CheckLiveUps from './components/CheckLiveUps'
import {
  AppContextProvider,
  InitContextComp,
  getAppValue,
  onChange,
} from './store'
import CheckNetState from './components/CheckNetState'
import CheckAppUpdate from './components/CheckAppUpdate'
import CheckUpUpdate from './components/CheckUpUpdate'

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
      errorRetryInterval: 2000,
      dedupingInterval: 3000,
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
  const appValue = React.useMemo(() => {
    return getAppValue()
  }, [])

  return (
    <RootSiblingParent>
      <StatusBar style="auto" />
      <SentryExpo.Native.ErrorBoundary fallback={errorFallback}>
        <ThemeProvider theme={theme}>
          <ThemeResponse />
          <SWRConfig value={swrConfig}>
            <AppContextProvider value={appValue} onChange={onChange}>
              <InitContextComp />
              <CheckAppUpdate />
              <CheckUpUpdate />
              <CheckNetState />
              <CheckLiveUps />
              <ButtonsOverlay />
              <ImagesView />
              <Route />
            </AppContextProvider>
          </SWRConfig>
        </ThemeProvider>
      </SentryExpo.Native.ErrorBoundary>
    </RootSiblingParent>
  )
}
