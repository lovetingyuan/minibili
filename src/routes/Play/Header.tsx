import { type RouteProp, useRoute } from '@react-navigation/native'
import { Icon } from '@rneui/base'
import { Text } from '@rneui/themed'
import React from 'react'
import { View } from 'react-native'

import { useUserRelation } from '@/api/user-relation'
import { useVideoInfo } from '@/api/video-info'
import { colors } from '@/constants/colors.tw'
import type { RootStackParamList } from '@/types'
import { parseNumber, showToast } from '@/utils'

import { useStore } from '../../store'

export default function PlayHeader() {
  const route = useRoute<RouteProp<RootStackParamList, 'Play'>>()
  const { data: vi } = useVideoInfo(route.params.bvid)
  const { data: fans } = useUserRelation(route.params?.mid || vi?.mid)
  const { _followedUpsMap } = useStore()
  const followed = route.params?.mid && route.params?.mid in _followedUpsMap

  return (
    <View className="flex-row items-center relative left-[-10px]">
      <Text className="text-lg font-semibold">
        {route.params?.name || vi?.name}
      </Text>
      <Text
        className="ml-3 text-gray-500 dark:text-gray-400"
        onPress={() => {
          showToast(`粉丝：${fans?.follower}`)
        }}>
        {` ${fans?.follower ? parseNumber(fans.follower) : ''}粉丝`}
      </Text>
      {followed ? (
        <Icon
          size={15}
          name="checkbox-marked-circle-outline"
          type="material-community"
          className="relative top-[1px] ml-2"
          color={tw(colors.secondary.text).color}
        />
      ) : null}
    </View>
  )
}
