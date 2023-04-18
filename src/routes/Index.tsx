import React from 'react'
import { StatusBar } from 'expo-status-bar'
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
import { Linking } from 'react-native'
import { Button } from '@rneui/themed'
import { site } from '../constants'
import HeaderTitle from './DynamicDetail/HeaderTitle'
import HeaderRight from './DynamicDetail/HeaderRight'
import PlayHeaderRight from './Play/HeaderRight'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default () => {
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
            options={() => {
              return {
                headerTitle: '',
                headerRight: () => PlayHeaderRight(),
              }
            }}
          />
          <Stack.Screen
            name="DynamicDetail"
            component={DynamicDetail}
            options={props => {
              return {
                headerTitle: () => HeaderTitle(props),
                headerRight: () => HeaderRight(props),
              }
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
              headerRight: () => (
                <Button
                  type="clear"
                  size="sm"
                  onPress={() => {
                    Linking.openURL(site + '?showchangelog=true')
                  }}>
                  更新日志
                </Button>
              ),
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SWRConfig>
  )
}
