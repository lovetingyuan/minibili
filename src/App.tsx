import NetInfo from '@react-native-community/netinfo'
import { createTheme, ThemeProvider } from '@rneui/themed'
import * as SentryExpo from '@sentry/react-native'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { AppState } from 'react-native'
import { RootSiblingParent } from 'react-native-root-siblings'
import { SWRConfig } from 'swr'
import type { ProviderConfiguration, SWRConfiguration } from 'swr/_internal'

import fetcher from './api/fetcher'
import ButtonsOverlay from './components/ButtonsOverlay'
import CheckAppUpdate from './components/CheckAppUpdate'
import CheckLiveUps from './components/CheckLiveUps'
import CheckNetState from './components/CheckNetState'
import CheckUpUpdate from './components/CheckUpUpdate'
import ErrorFallback from './components/ErrorFallback'
import ImagesView from './components/ImagesView'
import ShowRemoteConfig from './components/ShowRemoteConfig'
// import ThemeResponse from './components/ThemeResponse'
import { colors } from './constants/colors.tw'
import useIsDark from './hooks/useIsDark'
import Route from './routes/Index'
import {
  AppContextProvider,
  getAppValue,
  InitContextComp,
  onChange,
} from './store'
import { reportApiError } from './utils/report'

let online = true
let focus = true

const errorFallback: React.ComponentProps<
  typeof SentryExpo.ErrorBoundary
>['fallback'] = errorData => {
  return <ErrorFallback message={errorData.error.message} />
}

const swrConfig: SWRConfiguration & Partial<ProviderConfiguration> = {
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
    const subscription = AppState.addEventListener('change', nextAppState => {
      online = nextAppState === 'active'
      /* 如果正在从后台或非 active 模式恢复到 active 模式 */
      if (appState.match(/inactive|background/) && online) {
        callback()
      }
      appState = nextAppState
    })

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
  onError(err, key) {
    reportApiError(key, err)
  },
}

export default function App() {
  const [primary, secondary] = [
    tw(colors.primary.text).color,
    tw(colors.secondary.text).color,
  ]
  const isDark = useIsDark()
  const rneTheme = React.useMemo(() => {
    // console.log('change ui theme')
    return createTheme({
      lightColors: {
        primary,
        secondary,
      },
      darkColors: {
        primary,
        secondary,
      },
      mode: isDark ? 'dark' : 'light',
    })
  }, [primary, secondary, isDark])

  const appValue = React.useMemo(() => getAppValue(), [])

  return (
    <RootSiblingParent>
      <StatusBar style="auto" />
      <SentryExpo.ErrorBoundary fallback={errorFallback}>
        <AppContextProvider value={appValue} onChange={onChange}>
          <ThemeProvider theme={rneTheme}>
            {/* <ThemeResponse /> */}
            <SWRConfig value={swrConfig}>
              <InitContextComp />
              <ShowRemoteConfig />
              <CheckAppUpdate />
              <CheckUpUpdate />
              <CheckNetState />
              <CheckLiveUps />
              <ButtonsOverlay />
              <ImagesView />
              <Route />
            </SWRConfig>
          </ThemeProvider>
        </AppContextProvider>
      </SentryExpo.ErrorBoundary>
    </RootSiblingParent>
  )
}
