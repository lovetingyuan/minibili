import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SWRConfig } from 'swr'
import fetcher from './api/fetcher'
import { AppState, Appearance, View } from 'react-native'
import { ThemeProvider, createTheme } from '@rneui/themed'
import NetInfo from '@react-native-community/netinfo'
import ButtonsOverlay from './components/ButtonsOverlay'
import { RootSiblingParent } from 'react-native-root-siblings'
import Route from './routes/Index'
import * as SentryExpo from 'sentry-expo'
import type { FallbackRender } from '@sentry/react'
import { showToast } from './utils'
import ThemeResponse from './components/ThemeResponse'
import ImagesView from './components/ImagesView'
import type { ProviderConfiguration, SWRConfiguration } from 'swr/_internal'
import ErrorFallback from './components/ErrorFallback'
import useIsDark from './hooks/useIsDark'
import useMounted from './hooks/useMounted'

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

const errorFallback: FallbackRender = errorData => {
  return <ErrorFallback message={errorData.error.message} />
}

export default function App() {
  const netToastDelay = React.useRef<null | number>(null)
  const dark = useIsDark()
  useMounted(() => {
    return NetInfo.addEventListener(state => {
      if (state.isConnected && state.type === 'wifi') {
        return
      }
      if (typeof netToastDelay.current === 'number') {
        window.clearTimeout(netToastDelay.current)
      }
      netToastDelay.current = window.setTimeout(() => {
        NetInfo.fetch().then(state2 => {
          if (!state2.isConnected) {
            showToast(' 网络状况不佳 ')
          } else if (state2.type !== 'wifi') {
            showToast(' 请注意当前网络不是 wifi ')
          }
        })
      }, 1500)
    })
  })
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
  return (
    <SentryExpo.Native.ErrorBoundary fallback={errorFallback}>
      <RootSiblingParent>
        <ThemeProvider theme={theme}>
          <View style={containerStyle}>
            <SWRConfig value={swrConfig}>
              <StatusBar style="auto" />
              <ThemeResponse />
              <ButtonsOverlay />
              <ImagesView />
              <Route />
            </SWRConfig>
          </View>
        </ThemeProvider>
      </RootSiblingParent>
    </SentryExpo.Native.ErrorBoundary>
  )
}
