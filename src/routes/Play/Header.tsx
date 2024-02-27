import { type RouteProp, useRoute } from '@react-navigation/native'
import { Icon } from '@rneui/base'
import { Text, Tooltip } from '@rneui/themed'
import React from 'react'
import { View } from 'react-native'

import { useUserRelation } from '@/api/user-relation'
import { useVideoInfo } from '@/api/video-info'
import { colors } from '@/constants/colors.tw'
import type { RootStackParamList } from '@/types'
import { parseNumber } from '@/utils'

import { useStore } from '../../store'

export default function PlayHeader() {
  const route = useRoute<RouteProp<RootStackParamList, 'Play'>>()
  const { data: vi } = useVideoInfo(route.params.bvid)
  const { data: fans } = useUserRelation(route.params?.mid || vi?.mid)
  const { _followedUpsMap } = useStore()
  const followed = route.params?.mid && route.params?.mid in _followedUpsMap
  const [open, setOpen] = React.useState(false)

  return (
    <View className="flex-row items-center relative left-[-10px]">
      <Text className="text-lg font-semibold">
        {route.params?.name || vi?.name}
      </Text>
      <Tooltip
        visible={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        toggleAction="onLongPress"
        // closeOnlyOnBackdropPress={false}
        backgroundColor="rgba(150,150,150,0.8)"
        pointerColor={'rgba(0,0,0,0)'}
        containerStyle={tw('p-0 h-8 rounded-sm')}
        withOverlay={false}
        popover={<Text className="text-white">粉丝：{fans?.follower}</Text>}>
        <Text className="ml-3 text-gray-500 dark:text-gray-400">
          {` ${fans?.follower ? parseNumber(fans.follower) : ''}粉丝`}
        </Text>
      </Tooltip>

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
