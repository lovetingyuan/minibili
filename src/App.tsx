import NetInfo from '@react-native-community/netinfo'
import { ThemeProvider } from '@rneui/themed'
import * as SentryExpo from '@sentry/react-native'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { AppState, SafeAreaView } from 'react-native'
// import { RootSiblingParent } from 'react-native-root-siblings'
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
import RemoteConfig from './components/RemoteConfig'
import UserLocation from './components/UserLocation'
import useRNETheme from './hooks/useRNETheme'
import Route from './routes/Index'
import {
  AppContextProvider,
  InitStoreComp,
  onChange,
  useAppValue,
} from './store'
import { reportApiError } from './utils/report'

let online = true
const focus = true

const errorFallback: React.ComponentProps<
  typeof SentryExpo.ErrorBoundary
>['fallback'] = (errorData) => {
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
    let appState = AppState.currentState

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      online = nextAppState === 'active'
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
    return NetInfo.addEventListener((state) => {
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
  const rneTheme = useRNETheme()
  const appValue = useAppValue()
  return (
    <SafeAreaView className="flex-1">
      <StatusBar style="auto" translucent backgroundColor="transparent" />
      <SentryExpo.ErrorBoundary fallback={errorFallback}>
        <AppContextProvider value={appValue} onChange={onChange}>
          <ThemeProvider theme={rneTheme}>
            <SWRConfig value={swrConfig}>
              <InitStoreComp />
              <RemoteConfig />
              <CheckAppUpdate />
              <CheckUpUpdate />
              <CheckNetState />
              <CheckLiveUps />
              <ButtonsOverlay />
              <ImagesView />
              <UserLocation />
              <Route />
            </SWRConfig>
          </ThemeProvider>
        </AppContextProvider>
      </SentryExpo.ErrorBoundary>
    </SafeAreaView>
  )
}
