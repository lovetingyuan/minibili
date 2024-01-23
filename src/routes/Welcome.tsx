import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { View, Image, useWindowDimensions, Linking } from 'react-native'
import { RootStackParamList } from '../types'
import { Button, Text, useTheme } from '@rneui/themed'
import { useStore } from '../store'
import { githubLink } from '../constants'

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>

export default React.memo(function Welcome({ navigation }: Props) {
  const { set$firstRun } = useStore()
  const { width } = useWindowDimensions()
  const { theme } = useTheme()
  return (
    <View className="flex-1 h-full py-10">
      <View className="flex-row justify-center">
        <Image
          source={require('../../assets/minibili.png')}
          className="aspect-[33/10] h-auto"
          style={{ width: width * 0.8 }}
        />
      </View>
      <View className="p-8 flex-1">
        <Text className="text-2xl">欢迎使用极简版B站 😊</Text>
        <Text className="text-xl mt-5 mb-10 leading-8">
          这里没有推荐、没有算法、没有广告、没有乱七八糟的功能，只有简单地浏览。
        </Text>
        <Text className="text-base">
          🔈本应用为个人兴趣作品并完全开源(
          <Text
            style={{ color: theme.colors.primary }}
            onPress={() => {
              Linking.openURL(githubLink)
            }}>
            {'github'}
          </Text>
          )，所有数据均为B站官网公开，不会读取、存储、公开任何个人隐私数据，仅供学习交流!
        </Text>
        <Text className="text-base mt-5" style={{ color: theme.colors.grey2 }}>
          如果遇到闪退或报错请及时更新最新版本。
        </Text>
      </View>
      <Button
        size="lg"
        containerStyle={tw('mx-5 rounded-lg')}
        onPress={() => {
          set$firstRun(Date.now())
          navigation.replace('VideoList')
        }}>
        同意并开始使用
      </Button>
    </View>
  )
})
