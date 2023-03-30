import React from 'react'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Play from './Play'
import About from './About'
import WebPage from './WebPage'
import { RootStackParamList } from '../types'
import MainTab from './MainTab'
import Dynamic from './Dynamic'
import { NetToast } from '../components/NetToast'
import { SWRConfig } from 'swr'
import fetcher from '../api/fetcher'
import DynamicDetail from './DynamicDetail'

const Stack = createNativeStackNavigator<RootStackParamList>()

SplashScreen.preventAutoHideAsync()

export default () => {
  return (
    <SWRConfig
      value={{
        /* ... */
        fetcher,
      }}>
      <StatusBar style="auto" />
      <NetToast />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Main"
          screenOptions={{
            headerTitleStyle: {
              fontSize: 18,
              color: '#555',
            },
          }}>
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
          <Stack.Screen
            name="Play"
            component={Play}
            options={props => {
              return {
                headerTitle: props.route.params.name,
              }
            }}
          />
          <Stack.Screen
            name="DynamicDetail"
            component={DynamicDetail}
            options={props => {
              return {
                headerTitle: 'dynamicd etail', // props.route.params.name,
              }
            }}
          />
          <Stack.Screen
            name="WebPage"
            component={WebPage}
            options={props => {
              return {
                headerTitle: props.route.params.title,
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
    </SWRConfig>
  )
}
