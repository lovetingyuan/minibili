import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Button, Text } from '@rneui/themed'
import React from 'react'
import { Image, Linking, View } from 'react-native'

import { colors } from '@/constants/colors.tw'

import { githubLink } from '../constants'
import { useStore } from '../store'
import type { RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>

export default React.memo(Welcome)

function Welcome({ navigation }: Props) {
  const { set$firstRun } = useStore()
  return (
    <View className="flex-1 h-full py-10">
      <View className="flex-row justify-center">
        <Image
          source={require('../../assets/minibili.png')}
          className="aspect-[33/10] h-auto w-[80%]"
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
            className={colors.primary.text}
            onPress={() => {
              Linking.openURL(githubLink)
            }}>
            {'github'}
          </Text>
          )，所有数据均存放在手机本地，展示的所有数据均为B站官网公开，不会读取、存储、传播任何个人相关数据，仅供学习交流!
        </Text>
        <Text className="text-base mt-5 text-gray-600 dark:text-gray-400">
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
        知晓并开始使用
      </Button>
    </View>
  )
}
