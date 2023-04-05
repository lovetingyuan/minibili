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
import { Image, Pressable, Linking, Alert } from 'react-native'
import { openBiliVideo } from '../utils'
import { Button } from '@rneui/themed'
import { site } from '../constants'
import { useCheckVersion } from '../hooks/useCheckVersion'
import AsyncStorage from '@react-native-async-storage/async-storage'
import store from '../store'

const Stack = createNativeStackNavigator<RootStackParamList>()

SplashScreen.preventAutoHideAsync()

export default () => {
  const { data } = useCheckVersion()

  React.useEffect(() => {
    AsyncStorage.getItem('FIRST_RUN').then(res => {
      AsyncStorage.setItem('FIRST_RUN', 'false')
      if (!res) {
        Alert.alert(
          '使用说明',
          '本App为简易版B站，所有数据均为官方公开，切勿频繁刷新',
        )
      } else {
        if (
          data?.hasUpdate &&
          !store.$ignoredVersions.includes(data.latestVersion!)
        ) {
          Alert.alert(
            '有新版本',
            `${data.currentVersion} --> ${data.latestVersion}`,
            [
              {
                text: '取消',
              },
              {
                text: '忽略',
                onPress: () => {
                  store.$ignoredVersions.push(data.latestVersion!)
                },
              },
              {
                text: '下载更新',
                onPress: () => {
                  Linking.openURL(data.downloadLink!)
                },
              },
            ],
          )
        }
      }
    })
  }, [data])

  return (
    <SWRConfig
      value={{
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
              headerRight: () => {
                return (
                  <Button
                    type="clear"
                    size="sm"
                    onPress={() => {
                      Linking.openURL(site)
                    }}>
                    更新日志
                  </Button>
                )
              },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SWRConfig>
  )
}
