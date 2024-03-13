import { NavigationContainer, type RouteProp } from '@react-navigation/native'
import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import React from 'react'
import { View } from 'react-native'

import { colors } from '@/constants/colors.tw'
import useRouteTheme from '@/hooks/useRouteTheme'

import { useStore } from '../store'
import type { RootStackParamList } from '../types'
import { setScreenTag } from '../utils/report'
import About from './About'
import { headerRight as aboutHeaderRight } from './About/Header'
import Collect from './Collect'
import Dynamic from './Dynamic'
import DynamicDetail from './DynamicDetail'
import {
  dynamicDetailHeaderRight,
  dynamicDetailHeaderTitle,
} from './DynamicDetail/Header'
import Follow from './Follow'
import { followHeaderRight } from './Follow/Header'
import Play from './Play'
import SearchUps from './SearchUps'
import SearchVideos from './SearchVideos'
import VideoList from './VideoList'
import {
  videoListHeaderLeft,
  videoListHeaderRight,
  videoListHeaderTitle,
} from './VideoList/Header'
import WebPage from './WebPage'
import Welcome from './Welcome'

const Stack = createNativeStackNavigator<RootStackParamList>()

function Route() {
  const routeTheme = useRouteTheme()
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
      headerLeft: videoListHeaderLeft,
      headerTitleAlign: 'left',
      headerTitle: videoListHeaderTitle,
      headerRight: videoListHeaderRight,
      headerShown: true,
      headerStyle: {
        shadowColor: 'black',
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
  const titleColor = tw(colors.gray8.text).color
  const screenOptions = React.useMemo<NativeStackNavigationOptions>(() => {
    return {
      headerTransparent: false,
      headerTitleStyle: {
        fontSize: 18,
        color: titleColor,
      },
    }
  }, [titleColor])
  const { $firstRun } = useStore()
  const isFirstRun = $firstRun === 0
  return (
    <View className={`flex-1 ${colors.white.bg}`}>
      <NavigationContainer theme={routeTheme} key={$firstRun}>
        <Stack.Navigator
          initialRouteName={isFirstRun ? 'Welcome' : 'VideoList'}
          screenOptions={screenOptions}
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
            name="SearchVideos"
            component={SearchVideos}
            options={{
              headerTitle: '搜索视频',
            }}
          />
          <Stack.Screen
            name="Follow"
            component={Follow}
            options={{
              headerRight: followHeaderRight,
            }}
          />
          <Stack.Screen
            name="SearchUps"
            component={SearchUps}
            options={{
              headerTitle: '搜索UP主',
            }}
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
              headerTitle: dynamicDetailHeaderTitle,
              headerRight: dynamicDetailHeaderRight,
            }}
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
            options={{
              headerTitle: '关于',
              headerRight: aboutHeaderRight,
            }}
          />
          <Stack.Screen name="Collect" component={Collect} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  )
}

export default React.memo(Route)
