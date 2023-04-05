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
import { Image, Pressable, Linking } from 'react-native'
import { openBiliVideo } from '../utils'

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
                headerRight: () => {
                  return (
                    <Pressable
                      onPress={() => {
                        openBiliVideo(props.route.params.bvid)
                      }}>
                      <Image
                        style={{ width: 36, height: 14 }}
                        source={require('../../assets/bili-text.png')}
                      />
                    </Pressable>
                  )
                },
              }
            }}
          />
          <Stack.Screen
            name="DynamicDetail"
            component={DynamicDetail}
            options={props => {
              const { name, id } = props.route.params.detail
              return {
                headerTitle: name + '的动态', // props.route.params.name,
                headerRight: () => {
                  return (
                    <Pressable
                      onPress={() => {
                        Linking.openURL(`https://m.bilibili.com/dynamic/${id}`)
                      }}>
                      <Image
                        style={{ width: 36, height: 14 }}
                        source={require('../../assets/bili-text.png')}
                      />
                    </Pressable>
                  )
                },
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
