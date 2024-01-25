import { useNavigation } from '@react-navigation/native'
import { Avatar, Icon, Text } from '@rneui/themed'
import React from 'react'
import { View, Pressable } from 'react-native'
import { useVideoInfo } from '../../api/video-info'
import { NavigationProps } from '../../types'
import {
  handleShareVideo,
  imgUrl,
  parseDate,
  parseNumber,
  showToast,
} from '../../utils'
import { Image } from 'expo-image'

export default React.memo(function VideoHeader(props: { bvid: string }) {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { data: videoInfo } = useVideoInfo(props.bvid)
  const { name, face, mid, date, title } = videoInfo || {}
  return (
    <View className="flex-row items-center flex-wrap justify-between">
      <Pressable
        onPress={() => {
          if (!mid || !face || !name) {
            return
          }
          const user = {
            mid,
            face,
            name,
            sign: '-',
          }
          navigation.push('Dynamic', { user })
        }}
        className="flex-row items-center mr-1 flex-1">
        {face ? (
          <Avatar
            size={34}
            rounded
            source={{ uri: imgUrl(face, 80) }}
            ImageComponent={Image}
          />
        ) : null}
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className="ml-3 mr-1 text-base grow shrink font-bold">
          {name + ' '}
        </Text>
      </Pressable>
      <View className="flex-row shrink-0 items-center gap-3">
        <View className="flex-row items-center gap-1">
          <Icon name="date-range" size={15} />
          <Text className="text-xs">{parseDate(date)}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Icon name="play-circle-outline" size={15} />
          <Text className="text-xs">{parseNumber(videoInfo?.playNum)}</Text>
        </View>
        <Pressable
          className="flex-row items-center gap-1"
          onPress={() => {
            showToast('不支持点赞')
          }}>
          <Icon name="thumb-up-off-alt" size={15} />
          <Text className="text-xs">{parseNumber(videoInfo?.likeNum)}</Text>
        </Pressable>

        <Pressable
          className="flex-row items-center"
          onPress={() => {
            if (name && title && props.bvid) {
              handleShareVideo(name, title, props.bvid)
            }
          }}>
          <Icon type="material-community" name="share" size={20} />
          <Text className="text-xs">{parseNumber(videoInfo?.shareNum)}</Text>
        </Pressable>
      </View>
    </View>
  )
})
