import React from 'react'
import { StatusBar } from 'expo-status-bar'
import {
  DefaultTheme,
  DarkTheme,
  NavigationContainer,
} from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Play from './Play'
import About from './About'
import WebPage from './WebPage'
import { RootStackParamList } from '../types'
import MainTab from './MainTab'
import Dynamic from './Dynamic'
import { NetToast } from '../components/NetToast'
import { SWRConfig } from 'swr'
import fetcher from '../api/fetcher'
import DynamicDetail from './DynamicDetail'
import { Linking, AppState } from 'react-native'
import { Button, createTheme, ThemeProvider } from '@rneui/themed'
import { site } from '../constants'
import { HeaderTitle, HeaderRight } from './DynamicDetail/Header'
import NetInfo from '@react-native-community/netinfo'
import useIsDark from '../hooks/useIsDark'
import ThemeResponse from '../components/ThemeResponse'
import ButtonsOverlay from '../components/ButtonsOverlay'
import CookieProxy from '../components/CookieProxy'
import { setScreenTag } from '../utils/report'
import ImagesView from '../components/ImagesView'

const Stack = createNativeStackNavigator<RootStackParamList>()

let online = true
let focus = true

const theme = createTheme({
  lightColors: {
    black: '#333',
  },
  darkColors: {
    black: '#bbb',
  },
  mode: 'dark',
})

export default () => {
  const isDark = useIsDark()

  const MyTheme = isDark
    ? {
        ...DarkTheme,
        dark: true,
        colors: {
          ...DarkTheme.colors,
          background: '#222',
        },
      }
    : DefaultTheme

  return (
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
      <ThemeProvider theme={theme}>
        <StatusBar style="auto" />
        <NetToast />
        <ThemeResponse />
        <ButtonsOverlay />
        <CookieProxy />
        <ImagesView />
        <NavigationContainer theme={MyTheme}>
          <Stack.Navigator
            initialRouteName="Main"
            screenOptions={{
              headerTitleStyle: {
                fontSize: 18,
                color: isDark ? '#ccc' : '#333',
              },
            }}
            screenListeners={({ route }) => ({
              state: () => {
                setScreenTag(route.name, 'stack')
              },
            })}>
            <Stack.Screen
              name="Main"
              component={MainTab}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Dynamic"
              component={Dynamic}
              options={{
                headerTitle: '动态',
              }}
            />
            <Stack.Screen name="Play" component={Play} />
            <Stack.Screen
              name="DynamicDetail"
              component={DynamicDetail}
              options={{
                headerTitle: () => <HeaderTitle />,
                headerRight: () => <HeaderRight />,
              }}
            />
            <Stack.Screen
              name="WebPage"
              component={WebPage}
              options={props => {
                return {
                  headerTitle: props.route.params.title || '-',
                }
              }}
            />
            <Stack.Screen
              name="About"
              component={About}
              options={{
                headerTitle: '关于',
                headerRight: () => (
                  <Button
                    type="clear"
                    size="sm"
                    onPress={() => {
                      Linking.openURL(site + '?showchangelog=true')
                    }}>
                    更新日志
                  </Button>
                ),
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </SWRConfig>
  )
}
