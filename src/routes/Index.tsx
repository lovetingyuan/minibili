import React from 'react'
import {
  DefaultTheme,
  DarkTheme,
  NavigationContainer,
} from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Play from './Play'
import About from './About'
import WebPage from './WebPage'
import { RootStackParamList } from '../types'
import MainTab from './MainTab'
import Dynamic from './Dynamic'
import DynamicDetail from './DynamicDetail'
import aboutHeaderRight from './About/headerRight'
import useIsDark from '../hooks/useIsDark'
import { setScreenTag } from '../utils/report'
import {
  dynamicDetailHeaderRight,
  dynamicDetailHeaderTitle,
} from './DynamicDetail/Header'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function Route() {
  const isDark = useIsDark()

  const RouteTheme = isDark
    ? {
        ...DarkTheme,
        dark: true,
        colors: {
          ...DarkTheme.colors,
          background: '#222',
        },
      }
    : DefaultTheme
  return (
    <NavigationContainer theme={RouteTheme}>
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerTitleStyle: {
            fontSize: 18,
            color: isDark ? '#ccc' : '#333',
          },
        }}
        screenListeners={({ route }) => ({
          state: () => {
            setScreenTag(route.name, 'stack')
          },
        })}>
        <Stack.Screen
          name="Main"
          component={MainTab}
          options={{ headerShown: false }}
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
          name="WebPage"
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
      </Stack.Navigator>
    </NavigationContainer>
  )
}
