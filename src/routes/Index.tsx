import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'

import { colors } from '@/constants/colors.tw'
import useRouteTheme from '@/hooks/useRouteTheme'

import { useStore } from '../store'
import type { RootStackParamList } from '../types'
import About from './About'
import Collect from './Collect'
import Dynamic from './Dynamic'
import { Asset } from 'expo-asset'
import Follow from './Follow'
import { followHeaderRight } from './Follow/Header'
import History from './History'
import Music from './Music'
import Play from './Play'
import SearchUps from './SearchUps'
import SearchVideos from './SearchVideos'
import VideoList from './VideoList'

import WebPage from './WebPage'
import Welcome from './Welcome'

import { Assets as NavigationAssets } from '@react-navigation/elements'
import Living from './Living'
import DynamicDetail from './DynamicDetail'

Asset.loadAsync([
  ...NavigationAssets,
  // require('./assets/newspaper.png'),
  // require('./assets/bell.png'),
])

const Stack = createNativeStackNavigator<RootStackParamList>()

function Route() {
  const routeTheme = useRouteTheme()

  const { $firstRun, initialed } = useStore()
  const isFirstRun = initialed && $firstRun === -1

  return (
    <NavigationContainer theme={routeTheme}>
      <Stack.Navigator
        initialRouteName={isFirstRun ? 'Welcome' : 'VideoList'}
        screenOptions={{
          headerTransparent: false,
          headerTitleStyle: {
            fontSize: 18,
            color: tw(colors.gray8.text).color,
          },
        }}
        // screenListeners={undefined}
      >
        <Stack.Screen
          name="Welcome"
          component={Welcome}
          options={{
            headerTitle: '欢迎使用 MiniBili',
            // headerStyle: { backgroundColor: 'tomato' },
            // headerRight: () => <Text>fsk jkljkl jkljkl</Text>,
          }}
        />
        <Stack.Screen
          name="VideoList"
          component={VideoList}
          // options={{
          //   title: '',
          // }}
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
        <Stack.Screen name="Living" component={Living} />
        <Stack.Screen
          name="DynamicDetail"
          component={DynamicDetail}
          options={{
            headerTitle: '动态详情',
          }}
        />
        <Stack.Screen
          name={'WebPage'}
          component={WebPage}
          options={(props) => {
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
          }}
        />
        <Stack.Screen name="Collect" component={Collect} />
        <Stack.Screen name="History" component={History} />
        <Stack.Screen name="Music" component={Music} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default React.memo(Route)
