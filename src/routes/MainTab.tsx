import React, { ReactNode } from 'react'
import Follow from './Follow'
import VideoList from './VideoList'
import store from '../store'
import { useSnapshot } from 'valtio'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { LabelPosition } from '@react-navigation/bottom-tabs/lib/typescript/src/types'
import { Text, Vibration, View, StyleSheet, Pressable } from 'react-native'
import { Badge, Button, Icon, Overlay } from '@rneui/themed'
import { RootStackParamList } from '../types'
import { RanksConfig } from '../constants'

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

const HeaderTitle = () => {
  const [visible, setVisible] = React.useState(false)
  const { videosType } = useSnapshot(store)
  return (
    <View>
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: '100%',
        }}
        onPress={() => {
          setVisible(true)
        }}>
        <Text
          style={{
            fontSize: 19,
            fontWeight: 'bold',
          }}>
          {videosType.label +
            (videosType.rid === -1 ? '' : '排行') +
            (__DEV__ ? ' dev ' : ' ')}
        </Text>
        <Icon name="triangle-down" type="octicon" size={28} />
      </Pressable>
      <Overlay
        isVisible={visible}
        backdropStyle={{
          backgroundColor: 'rgba(0,0,0,0.0001)',
        }}
        overlayStyle={{
          paddingHorizontal: 0,
          paddingVertical: 10,
          position: 'absolute',
          top: 50,
          left: 15,
        }}
        onBackdropPress={() => {
          setVisible(false)
        }}>
        <View style={{ width: 80 }}>
          {RanksConfig.map(item => {
            return (
              <Button
                type="clear"
                key={item.rid}
                onPress={() => {
                  store.videosType = item
                  setVisible(false)
                }}>
                {item.label}
              </Button>
            )
          })}
        </View>
      </Overlay>
    </View>
  )
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
      initialRouteName="VideoList"
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
        options={() => {
          return {
            tabBarLabel: getLabel('视频'),
            headerTitle: HeaderTitle,
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
