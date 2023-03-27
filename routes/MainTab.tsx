import React, { ReactNode } from 'react'
import Follow from './Follow'
import Hot from './Hot'
import store from '../store'
import { useSnapshot } from 'valtio'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { LabelPosition } from '@react-navigation/bottom-tabs/lib/typescript/src/types'
import { Text, View } from 'react-native'
import { Badge } from '@rneui/base'
import { RootStackParamList } from '../types'

const Tab = createBottomTabNavigator<RootStackParamList>()

const getLabel = (text: string, updatedCount?: number, hasLiving?: boolean) => {
  const labelCmp: (props: {
    focused: boolean
    color: string
    position: LabelPosition
  }) => ReactNode = props => {
    const label = (
      <Text
        style={{
          color: props.color,
          fontSize: props.focused ? 19 : 18,
          fontWeight: props.focused ? 'bold' : 'normal',
        }}>
        {text}
      </Text>
    )
    if (text === '我的' && updatedCount) {
      return (
        <View>
          <Badge
            status="success"
            value={updatedCount}
            badgeStyle={{
              height: 18,
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
          {label}
        </View>
      )
    }
    return label
  }
  return labelCmp
}

const MainTab = () => {
  const { updatedUps, livingUps } = useSnapshot(store)
  const updateCount = Object.values(updatedUps).filter(Boolean).length
  const hasLiving = Object.values(livingUps).filter(Boolean).length > 0
  return (
    <Tab.Navigator
      initialRouteName="Hot"
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
        name="Hot"
        component={Hot}
        options={() => {
          return {
            tabBarLabel: getLabel('热门'),
            headerTitle: '🔥 热门' + (__DEV__ ? ' dev' : ''),
            headerTitleStyle: { fontSize: 18, color: '#555' },
            headerShown: true,
            headerRight() {
              return null
            },
          }
        }}
      />
      {/* {dynamicUser ? (
        <Tab.Screen
          name="Dynamic"
          component={Dynamic}
          options={{
            tabBarLabel: getLabel('动态'),
          }}
        />
      ) : null} */}
      <Tab.Screen
        name="Follow"
        component={Follow}
        options={{
          tabBarLabel: getLabel('我的', updateCount, hasLiving),
        }}
      />
    </Tab.Navigator>
  )
}
export default MainTab
