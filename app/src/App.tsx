import '../global.css'

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import NetInfo from '@react-native-community/netinfo'
import { StatusBar } from 'expo-status-bar'
import { AppState } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
// import { RootSiblingParent } from 'react-native-root-siblings'
import { SWRConfig } from 'swr'
import type { ProviderConfiguration, SWRConfiguration } from 'swr/_internal'

import fetcher from './api/fetcher'
import ButtonsOverlay from './components/ButtonsOverlay'
import ErrorFallback from './components/ErrorFallback'
import ImagesView from './components/ImageViewer'
import {
  BilibiliAuthExpirationManager,
  BilibiliBlacklistManager,
  BilibiliFollowingsManager,
  CheckAppUpdate,
  CheckNetState,
  FollowingDynamicsUnreadManager,
  FollowingDynamicsUpdatesManager,
  LiveUpsManager,
  UserDataManager,
  VideoDownloadManager,
  WatchLaterManager,
  WatchProgressManager,
} from './components/managers'
import { MenuProvider, menuProviderCustomStyles } from './components/Menu'
import { posthog } from './config/posthog'
import useAppOrientation from './hooks/useAppOrientation'
import { isLoginRequiredError } from './features/bilibili-session/login-required'
import Route from './routes/Index'
import ErrorBoundary from 'react-native-error-boundary'
import { InitStoreComp } from './store'
import { ToastHost } from './features/toast'

let online = true

function captureRenderError(error: Error, componentStack: string) {
  if (!__DEV__) {
    posthog?.captureException(error, { component_stack: componentStack })
  }
}

const SWRConfigValue: SWRConfiguration & Partial<ProviderConfiguration> = {
  fetcher,
  errorRetryCount: 2,
  errorRetryInterval: 1000,
  shouldRetryOnError(error) {
    return !isLoginRequiredError(error)
  },
  dedupingInterval: 5000,
  isVisible() {
    return AppState.currentState === 'active'
  },
  isOnline() {
    return online
  },
  initFocus(callback) {
    let appState = AppState.currentState

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
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
  useAppOrientation()
  return (
    <SafeAreaProvider>
      <SWRConfig value={SWRConfigValue}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <MenuProvider backHandler customStyles={menuProviderCustomStyles}>
            <ErrorBoundary FallbackComponent={ErrorFallback} onError={captureRenderError}>
              {/* sheet 内容通过 portal 渲染，放在 MenuProvider/ErrorBoundary 里面才能继承它们的 context */}
              <BottomSheetModalProvider>
                <InitStoreComp />
                <BilibiliAuthExpirationManager />
                <BilibiliFollowingsManager />
                <BilibiliBlacklistManager />
                <UserDataManager />
                <CheckAppUpdate />
                <CheckNetState />
                <LiveUpsManager />
                <FollowingDynamicsUpdatesManager />
                <FollowingDynamicsUnreadManager />
                <WatchLaterManager />
                <WatchProgressManager />
                <VideoDownloadManager />
                <ButtonsOverlay />
                <ImagesView />
                <Route />
              </BottomSheetModalProvider>
            </ErrorBoundary>
            <ToastHost />
          </MenuProvider>
          <StatusBar style="auto" />
        </GestureHandlerRootView>
      </SWRConfig>
    </SafeAreaProvider>
  )
}
