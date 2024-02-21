import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type RouteProp,
} from '@react-navigation/native'
import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import React from 'react'

import useIsDark from '../hooks/useIsDark'
import { useStore } from '../store'
import type { RootStackParamList } from '../types'
import { setScreenTag } from '../utils/report'
import About from './About'
import aboutHeaderRight from './About/headerRight'
import Dynamic from './Dynamic'
import DynamicDetail from './DynamicDetail'
import {
  dynamicDetailHeaderRight,
  dynamicDetailHeaderTitle,
} from './DynamicDetail/Header'
import Follow from './Follow'
import { followHeaderRight, followHeaderTitle } from './Follow/Header'
import Play from './Play'
import VideoList from './VideoList'
import { videoListHeaderRight, videoListHeaderTitle } from './VideoList/Header'
import WebPage from './WebPage'
import Welcome from './Welcome'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default React.memo(function Route() {
  const isDark = useIsDark()

  const RouteTheme = React.useMemo(() => {
    return isDark
      ? {
          ...DarkTheme,
          dark: true,
          colors: {
            ...DarkTheme.colors,
            background: '#222222',
            // backgroundColor: 'black',
          },
        }
      : DefaultTheme
  }, [isDark])

  const onRouteChange = React.useCallback(
    ({ route }: { route: RouteProp<RootStackParamList> }) => {
      return {
        state: () => {
          setScreenTag(route.name)
        },
      }
    },
    [],
  )
  const videosOptions = React.useMemo<NativeStackNavigationOptions>(() => {
    return {
      headerTitle: videoListHeaderTitle,
      headerTitleAlign: 'left',
      headerRight: videoListHeaderRight,
      headerShown: true,
      headerStyle: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
        elevation: 3, // 仅在 Android 平台上需要设置
      } as any,
    }
  }, [])
  const welcomeOptions = React.useMemo(() => {
    return {
      headerTitle: '欢迎使用 MiniBili',
    }
  }, [])
  const { $firstRun } = useStore()
  const isFirstRun = $firstRun === 0
  return (
    <NavigationContainer theme={RouteTheme} key={$firstRun}>
      <Stack.Navigator
        initialRouteName={isFirstRun ? 'Welcome' : 'VideoList'}
        screenOptions={React.useMemo(() => {
          return {
            // headerStatusBarHeight: 50,
            headerTitleStyle: {
              fontSize: 18,
              color: isDark ? '#ccc' : '#333',
            },
            cardStyle: { backgroundColor: '#000' },
          }
        }, [isDark])}
        screenListeners={onRouteChange}>
        <Stack.Screen
          name="Welcome"
          component={Welcome}
          options={welcomeOptions}
        />
        <Stack.Screen
          name="VideoList"
          component={VideoList}
          options={videosOptions}
        />
        <Stack.Screen
          name="Follow"
          component={Follow}
          options={React.useMemo(() => {
            return {
              headerTitle: followHeaderTitle,
              headerRight: followHeaderRight,
            }
          }, [])}
        />
        <Stack.Screen
          name="Dynamic"
          component={Dynamic}
          options={React.useMemo(() => {
            return {
              headerTitle: '动态',
            }
          }, [])}
        />
        <Stack.Screen name="Play" component={Play} />
        <Stack.Screen
          name="DynamicDetail"
          component={DynamicDetail}
          options={React.useMemo(() => {
            return {
              headerTitle: dynamicDetailHeaderTitle,
              headerRight: dynamicDetailHeaderRight,
            }
          }, [])}
        />
        <Stack.Screen
          name={'WebPage'}
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
          options={React.useMemo(() => {
            return {
              headerTitle: '关于',
              headerRight: aboutHeaderRight,
            }
          }, [])}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
})
