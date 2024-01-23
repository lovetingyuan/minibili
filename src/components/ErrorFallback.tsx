import React from 'react'
import { showFatalError } from '../utils'
import { Button, Image, Linking, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { site } from '../constants'
import useIsDark from '../hooks/useIsDark'
import * as Updates from 'expo-updates'
import useMounted from '../hooks/useMounted'
import { useTheme } from '@rneui/themed'

export default function ErrorFallback(props: { message?: string }) {
  useMounted(() => {
    showFatalError()
  })
  const { theme } = useTheme()
  if (__DEV__ && props.message) {
    // eslint-disable-next-line no-console
    console.error(props.message)
  }
  const dark = useIsDark()
  return (
    <View
      className="flex-1"
      style={dark ? { backgroundColor: theme.colors.black } : {}}>
      <StatusBar style="auto" />
      <Image
        source={require('../../assets/error.png')}
        className="aspect-square w-80"
      />
      <Text className="mx-7 text-base" style={{ color: theme.colors.error }}>
        非常抱歉，应用发生了未知错误
        {'\n\n'}
        <Text className="italic text-xs">{props.message || 'N/A'}</Text>
        {'\n\n'}
        我们会处理这个错误，感谢您的理解和支持
        {'\n\n'}
        您可以
        <Text
          className="font-bold"
          style={{ color: theme.colors.primary }}
          onPress={() => {
            Updates.reloadAsync()
          }}>
          {' 重启应用 '}
        </Text>
        ，我们推荐您安装新版
      </Text>
      <View className="my-8 px-8">
        <Button
          title="下载最新版本"
          onPress={() => {
            Linking.openURL(site)
          }}
        />
      </View>
    </View>
  )
}
