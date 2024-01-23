import { Icon, Text, useTheme } from '@rneui/themed'
import React from 'react'
import { View, Pressable } from 'react-native'
import { handleShareVideo, parseNumber, showToast } from '../../utils'

export default function DynamicStat(props: {
  id: string | number
  name: string
  date: string
  top?: boolean
  like: number
  share: number
  title: string
}) {
  const { theme } = useTheme()
  const gray = theme.colors.grey1
  const textStyle = {
    color: gray,
    fontSize: 13,
  }
  return (
    <View className="flex-row shrink-0 min-w-20 items-center gap-5 mt-3">
      <View className="flex-row items-center gap-1">
        <Icon name="date-range" size={15} color={gray} />
        <Text style={textStyle}>{props.date}</Text>
      </View>
      <View className="flex-row items-center gap-1">
        <Icon name="thumb-up-off-alt" size={15} color={gray} />
        {props.like ? (
          <Text
            style={textStyle}
            onPress={() => {
              showToast('不支持点赞')
            }}>
            {parseNumber(props.like)}
          </Text>
        ) : null}
      </View>
      <Pressable
        className="flex-row items-center"
        onPress={() => {
          handleShareVideo(props.name, props.title, props.id)
        }}>
        <Icon type="material-community" name="share" size={20} color={gray} />
        {props.share ? (
          <Text style={textStyle}>{parseNumber(props.share)}</Text>
        ) : null}
      </Pressable>
    </View>
  )
}
