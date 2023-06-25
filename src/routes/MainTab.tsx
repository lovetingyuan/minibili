import React from 'react'
import Follow from './Follow'
import VideoList from './VideoList'
import { useStore } from '../store'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import {
  BottomTabNavigationOptions,
  LabelPosition,
} from '@react-navigation/bottom-tabs/lib/typescript/src/types'
import { View, ActivityIndicator } from 'react-native'
import { Badge, Text } from '@rneui/themed'
import { RootStackParamList } from '../types'
import { videoListHeaderTitle, videoListHeaderRight } from './VideoList/Header'
import { setScreenTag } from '../utils/report'
import { RouteProp } from '@react-navigation/native'

const Tab = createBottomTabNavigator<RootStackParamList>()

type BottomLabelProps = {
  focused: boolean
  color: string
  position: LabelPosition
}

function BottomLabel(props: { name: string; color: string; focused: boolean }) {
  const { $upUpdateMap, $userInfo, checkingUpUpdate, livingUps } = useStore()
  const updatedCount = Object.values($upUpdateMap).filter(item => {
    return item.latestId !== item.currentLatestId
  }).length
  const hasLiving = Object.values(livingUps).filter(Boolean).length > 0
  const showedLoading = React.useRef<boolean>(false)
  let showloading = false
  if (!showedLoading.current && checkingUpUpdate) {
    showloading = true
    showedLoading.current = true
  }
  const labelStyle: any = { fontSize: 18 }
  if (props.focused) {
    labelStyle.color = props.color
    labelStyle.fontSize = 19
    labelStyle.fontWeight = 'bold'
  }
  const text = {
    VideoList: '视频' + (__DEV__ ? 'dev' : ''),
    Follow: $userInfo ? '关注' : '登录',
  }[props.name]
  const label = <Text style={labelStyle}>{text}</Text>

  if (props.name === 'Follow' && $userInfo && updatedCount) {
    return (
      <View>
        {showloading ? (
          <ActivityIndicator
            color="#fb7299"
            animating
            size={'small'}
            style={{
              position: 'absolute',
              left: 30,
              top: -5,
              transform: [{ scale: 0.9 }],
            }}
          />
        ) : (
          <Badge
            status="success"
            value={updatedCount}
            badgeStyle={{
              height: 17,
              backgroundColor: hasLiving ? '#00a1d6' : '#fb7299',
              position: 'absolute',
              left: 30,
              top: -5,
            }}
            textStyle={{
              fontSize: 11,
              fontWeight: props.focused ? 'bold' : 'normal',
            }}
          />
        )}
        {label}
      </View>
    )
  }
  return label
}

const getLabel = (name: string) => {
  return (p: BottomLabelProps) => (
    <BottomLabel name={name} focused={p.focused} color={p.color} />
  )
}

export default function MainTab() {
  const options = React.useMemo<BottomTabNavigationOptions>(() => {
    return {
      headerShown: false,
      tabBarIconStyle: {
        display: 'none',
      },
      tabBarItemStyle: {
        alignItems: 'center',
        justifyContent: 'center',
      },
      tabBarLabelStyle: {
        fontSize: 16,
      },
      tabBarActiveTintColor: '#FB7299',
    }
  }, [])
  const onRouteChange = React.useCallback(
    ({ route }: { route: RouteProp<RootStackParamList> }) => {
      return {
        state: () => {
          setScreenTag(route.name, 'tab')
        },
      }
    },
    [],
  )
  const videosOptions = React.useMemo<BottomTabNavigationOptions>(() => {
    return {
      tabBarLabel: getLabel('VideoList' as const),
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
      },
    }
  }, [])
  const followOptions = React.useMemo<BottomTabNavigationOptions>(() => {
    return {
      tabBarLabel: getLabel('Follow'),
    }
  }, [])
  return (
    <Tab.Navigator
      initialRouteName="VideoList"
      screenListeners={onRouteChange}
      screenOptions={options}>
      <Tab.Screen
        name="VideoList"
        component={VideoList}
        options={videosOptions}
      />
      <Tab.Screen name="Follow" component={Follow} options={followOptions} />
    </Tab.Navigator>
  )
}
