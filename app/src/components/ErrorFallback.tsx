import { StatusBar } from 'expo-status-bar'
import * as Updates from 'expo-updates'
import React from 'react'
import { Button, Image, Linking, Text, View } from 'react-native'

import { colors } from '@/constants/colors.tw'

import { site } from '../constants'

export default function ErrorFallback(props: {
  error: Error
  resetError: Function
}) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.error(props.error)
  }
  return (
    <View className="flex-1 dark:bg-neutral-900">
      <StatusBar style="auto" />
      <Image
        source={require('../../assets/error.png')}
        className="aspect-square w-80"
      />
      <Text className="mx-7 text-base text-red-600">
        非常抱歉，应用发生了未知错误
        {'\n\n'}
        <Text className="text-xs italic">{props.error.message || '😔'}</Text>
        {'\n\n'}
        我们会处理这个错误，感谢您的理解和支持
        {'\n\n'}
        您可以
        <Text
          className={`font-bold ${colors.primary.text}`}
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
