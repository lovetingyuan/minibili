import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { colors } from '@/constants/colors.tw'
import useResolvedColor from '@/hooks/useResolvedColor'
import useRouteTheme from '@/hooks/useRouteTheme'

import { useStore } from '../store'
import type { RootStackParamList } from '../types'
import About from './About'
import Dynamic from './Dynamic'
import { Asset } from 'expo-asset'
import Follow from './Followings'
import { followHeaderRight, followHeaderTitle } from './Followings/Header'
import Play from './Play'
import SearchVideos from './SearchVideos'
import VideoList from './VideoList'

import WebPage from './WebPage'
import Welcome from './Welcome'

import { Assets as NavigationAssets } from '@react-navigation/elements'
import Living from './Living'
import DynamicDetail from './DynamicDetail'

Asset.loadAsync([...NavigationAssets])

const Stack = createNativeStackNavigator<RootStackParamList>()

function AppRoute() {
  const routeTheme = useRouteTheme()

  const { $firstRun, initialed } = useStore()
  const isFirstRun = $firstRun === -1
  const headerTitleColor = useResolvedColor(colors.gray8.text)

  if (!initialed) {
    return null
  }

  return (
    <NavigationContainer theme={routeTheme}>
      <Stack.Navigator
        initialRouteName={isFirstRun ? 'Welcome' : 'VideoList'}
        screenOptions={{
          headerTransparent: false,
          headerTitleStyle: {
            fontSize: 18,
            color: headerTitleColor,
          },
        }}
      >
        <Stack.Screen
          name="Welcome"
          component={Welcome}
          options={{
            headerTitle: '欢迎使用 MiniBili',
          }}
        />
        <Stack.Screen name="VideoList" component={VideoList} />
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
            headerTitle: followHeaderTitle,
            headerTitleAlign: 'left',
            headerRight: followHeaderRight,
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
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppRoute
