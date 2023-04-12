import React, { ReactNode } from 'react'
import Follow from './Follow'
import Hot from './Hot'
import store from '../store'
import { useSnapshot } from 'valtio'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { LabelPosition } from '@react-navigation/bottom-tabs/lib/typescript/src/types'
import { Text, Vibration, View, StyleSheet } from 'react-native'
import { Badge } from '@rneui/themed'
import { RootStackParamList } from '../types'

const Tab = createBottomTabNavigator<RootStackParamList>()

const getLabel = (text: string, updatedCount?: number, hasLiving?: boolean) => {
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
    })
    const label = <Text style={style.label}>{text}</Text>
    if (text === '关注' && updatedCount) {
      return (
        <View>
          <Badge
            status="success"
            value={updatedCount}
            badgeStyle={style.updateBadge}
            textStyle={style.updateBadgeText}
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
  React.useEffect(() => {
    if (hasLiving) {
      Vibration.vibrate(1000)
    }
  }, [hasLiving])
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
      <Tab.Screen
        name="Follow"
        component={Follow}
        options={{
          tabBarLabel: getLabel('关注', updateCount, hasLiving),
        }}
      />
    </Tab.Navigator>
  )
}

export default MainTab