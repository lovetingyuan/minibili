import { Avatar, Button, Text } from '@rneui/themed'
import React from 'react'
import { View } from 'react-native'

import { colors } from '@/constants/colors.tw'
import { parseNumber } from '@/utils'

export function Test() {
  const up = {
    face: 'https://i1.hdslb.com/bfs/face/35def5856513a78806eab51d8d22eb38fce99c49.jpg',
    fans: 287,
    mid: 231757393,
    name: '九 厘米的雾考虑考虑龙',
    sign: '分享中越故事',
  }
  const props = { up }
  return (
    <View className="flex-1 flex-row items-center justify-between px-4">
      <View className="mr-2 flex-1 flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center gap-4">
          <Avatar rounded source={{ uri: props.up.face }} size={40} />
          <Text
            numberOfLines={2}
            className={`${colors.primary.text} text-base flex-1`}
            ellipsizeMode="tail">
            {props.up.name}\dfhdjkfhskdfhksfjkldsjfksldfjksldfjklsdfjksdl
          </Text>
        </View>
        <Text className={`${colors.gray6.text} text-sm`}>
          {'  '}
          {parseNumber(props.up.fans)}粉丝
        </Text>
      </View>
      <Button size="sm" type="clear" title={'关注'} />
    </View>
  )
}
