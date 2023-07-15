import React from 'react'
import {
  DefaultTheme,
  DarkTheme,
  NavigationContainer,
  RouteProp,
} from '@react-navigation/native'
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack'
import Play from './Play'
import About from './About'
import WebPage from './WebPage'
import { RootStackParamList } from '../types'
// import MainTab from './MainTab'
import Dynamic from './Dynamic'
import DynamicDetail from './DynamicDetail'
import aboutHeaderRight from './About/headerRight'
import useIsDark from '../hooks/useIsDark'
import { setScreenTag } from '../utils/report'
import {
  dynamicDetailHeaderRight,
  dynamicDetailHeaderTitle,
} from './DynamicDetail/Header'
import Follow from './Follow'
import VideoList from './VideoList'
import { videoListHeaderRight, videoListHeaderTitle } from './VideoList/Header'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function Route() {
  const isDark = useIsDark()

  const RouteTheme = React.useMemo(() => {
    return isDark
      ? {
          ...DarkTheme,
          dark: true,
          colors: {
            ...DarkTheme.colors,
            background: '#222',
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
  return (
    <NavigationContainer theme={RouteTheme}>
      <Stack.Navigator
        initialRouteName="VideoList"
        screenOptions={React.useMemo(() => {
          return {
            // headerStatusBarHeight: 50,
            headerTitleStyle: {
              fontSize: 18,
              color: isDark ? '#ccc' : '#333',
            },
          }
        }, [isDark])}
        screenListeners={onRouteChange}>
        <Stack.Screen
          name="VideoList"
          component={VideoList}
          options={videosOptions}
        />
        <Stack.Screen name="Follow" component={Follow} />
        {/* <Stack.Screen
          name="Main"
          component={MainTab}
          options={React.useMemo(() => {
            return { headerShown: false }
          }, [])}
        /> */}
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
}
