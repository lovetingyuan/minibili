import '../global.css'

import NetInfo from '@react-native-community/netinfo'
import { ThemeProvider } from '@/components/styled/rneui'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { AppState } from 'react-native'
// import { RootSiblingParent } from 'react-native-root-siblings'
import { SWRConfig } from 'swr'
import type { ProviderConfiguration, SWRConfiguration } from 'swr/_internal'

import fetcher from './api/fetcher'
import ButtonsOverlay from './components/ButtonsOverlay'
import CheckAppUpdate from './components/CheckAppUpdate'
import CheckLiveUps from './components/CheckLiveUps'
import CheckNetState from './components/CheckNetState'
import CheckUpUpdate from './components/CheckUpUpdate'
import ImagesView from './components/ImagesView'
import RemoteConfig from './components/RemoteConfig'
import UserLocation from './components/UserLocation'
import useRNETheme from './hooks/useRNETheme'
import Route from './routes/Index'
import ErrorBoundary from 'react-native-error-boundary'
import ErrorFallback from './components/ErrorFallback'
import { InitStoreComp } from './store'

let online = true
const focus = true

const SWRConfigValue: SWRConfiguration & Partial<ProviderConfiguration> = {
  fetcher,
  errorRetryCount: 2,
  errorRetryInterval: 1000,
  dedupingInterval: 5000,
  isVisible() {
    return focus
  },
  isOnline() {
    return online
  },
  initFocus(callback) {
    let appState = AppState.currentState

    const subscription = AppState.addEventListener('change', nextAppState => {
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

export default function App() {
  const rneTheme = useRNETheme()
  return (
    <SWRConfig value={SWRConfigValue}>
      <ThemeProvider theme={rneTheme}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
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
        </ErrorBoundary>
      </ThemeProvider>
      <StatusBar style="auto" translucent />
    </SWRConfig>
  )
}
