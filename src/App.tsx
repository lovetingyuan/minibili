import React from 'react'
import { StatusBar } from 'expo-status-bar'

import NetToast from './components/NetToast'
import { SWRConfig } from 'swr'
import fetcher from './api/fetcher'
import { AppState } from 'react-native'
import { ThemeProvider, createTheme } from '@rneui/themed'
import NetInfo from '@react-native-community/netinfo'
import ThemeResponse from './components/ThemeResponse'
import ButtonsOverlay from './components/ButtonsOverlay'
import CookieProxy from './components/CookieProxy'
import ImagesView from './components/ImagesView'
import { RootSiblingParent } from 'react-native-root-siblings'
import Route from './routes/Index'

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

export default function App() {
  return (
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
          <NetToast />
          <ThemeResponse />
          <ButtonsOverlay />
          <CookieProxy />
          <ImagesView />
          <Route />
        </SWRConfig>
      </ThemeProvider>
    </RootSiblingParent>
  )
}
