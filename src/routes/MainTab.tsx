import React, { ReactNode } from 'react'
import Follow from './Follow'
import VideoList from './VideoList'
import Login from './Login'
import { useStore } from '../store'

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { LabelPosition } from '@react-navigation/bottom-tabs/lib/typescript/src/types'
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native'
import { Avatar, Badge } from '@rneui/themed'
import { RootStackParamList } from '../types'
import HeaderTitle from './VideoList/HeaderTitle'
import { setScreenTag } from '../utils/report'

const Tab = createBottomTabNavigator<RootStackParamList>()

const getLabel = (
  text: string,
  updatedCount?: number,
  hasLiving?: boolean,
  checkingUpUpdate?: boolean,
) => {
  const labelCmp: (props: {
    focused: boolean
    color: string
    position: LabelPosition
  }) => ReactNode = props => {
    const style = StyleSheet.create({
      label: {
        color: props.color,
        fontSize: props.focused ? 19 : 18,
        fontWeight: props.focused ? 'bold' : 'normal',
      },
      updateBadge: {
        height: 17,
        backgroundColor: hasLiving ? '#00a1d6' : '#fb7299',
        position: 'absolute',
        left: 30,
        top: -5,
      },
      updateBadgeText: {
        fontSize: 11,
        fontWeight: props.focused ? 'bold' : 'normal',
      },
      checkingUpdate: {
        position: 'absolute',
        left: 30,
        top: -5,
        scale: 0.9,
      },
    })
    const label = <Text style={style.label}>{text}</Text>

    if (text === '关注' && updatedCount) {
      return (
        <View>
          {checkingUpUpdate ? (
            <ActivityIndicator
              color="#fb7299"
              animating
              size={'small'}
              style={style.checkingUpdate}
            />
          ) : (
            <Badge
              status="success"
              value={updatedCount}
              badgeStyle={style.updateBadge}
              textStyle={style.updateBadgeText}
            />
          )}
          {label}
        </View>
      )
    }
    return label
  }
  return labelCmp
}

const MainTab = () => {
  const { updatedUps, livingUps, checkingUpUpdate, $userInfo } = useStore()
  const updateCount = Object.values(updatedUps).filter(Boolean).length
  const hasLiving = Object.values(livingUps).filter(Boolean).length > 0
  return (
    <Tab.Navigator
      initialRouteName="VideoList"
      screenListeners={({ route }) => ({
        state: () => {
          setScreenTag(route.name, 'tab')
        },
      })}
      screenOptions={{
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
      }}>
      <Tab.Screen
        name="VideoList"
        component={VideoList}
        options={({ navigation }) => ({
          tabBarLabel: getLabel('视频' + (__DEV__ ? ' dev' : '')),
          headerTitle: () => <HeaderTitle />,
          headerRight: () => {
            const face = $userInfo?.face
            if (!face) {
              return null
            }
            return (
              <Avatar
                size={30}
                rounded
                containerStyle={{
                  marginHorizontal: 20,
                }}
                source={{ uri: face + '@80w_80h_1c.webp' }}
                onPress={() => {
                  navigation.navigate('Dynamic', {
                    user: { ...$userInfo },
                  })
                }}
              />
            )
          },
          headerShown: true,
        })}
      />
      {$userInfo ? (
        <Tab.Screen
          name="Follow"
          component={Follow}
          options={{
            tabBarLabel: getLabel(
              '关注',
              updateCount,
              hasLiving,
              checkingUpUpdate,
            ),
          }}
        />
      ) : (
        <Tab.Screen
          name="Login"
          component={Login}
          options={{
            tabBarLabel: getLabel('登录'),
          }}
        />
      )}
    </Tab.Navigator>
  )
}

export default MainTab
