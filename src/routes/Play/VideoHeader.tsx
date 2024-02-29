import {
  type RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native'
import { Avatar, Icon, Text } from '@rneui/themed'
import { Image } from 'expo-image'
import React from 'react'
import { Pressable, View } from 'react-native'

import { useVideoInfo } from '../../api/video-info'
import type { NavigationProps, RootStackParamList } from '../../types'
import {
  handleShareVideo,
  imgUrl,
  parseDate,
  parseNumber,
  showToast,
} from '../../utils'

export default React.memo(VideoHeader)

function VideoHeader() {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const route = useRoute<RouteProp<RootStackParamList, 'Play'>>()
  const { data } = useVideoInfo(route.params.bvid)
  const videoInfo = {
    ...data,
    ...route.params,
  }
  const { name, face, mid, date, title } = videoInfo
  return (
    <View className="items-center flex-wrap justify-between flex-1 shrink-0 gap-3">
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
        className="flex-row items-center justify-between mr-1 shrink-0">
        <Avatar
          size={34}
          rounded
          source={{
            uri: face
              ? imgUrl(face, 80)
              : require('../../../assets/loading.png'),
          }}
          ImageComponent={Image}
        />
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className="ml-3 mr-1 text-base grow font-bold">
          {name ? name + ' ' : ' '}
        </Text>
      </Pressable>
      <View className="flex-row w-full justify-start gap-x-4 gap-y-1 flex-1 flex-wrap">
        <View className="flex-row items-center gap-1">
          <Icon name="date-range" size={15} />
          <Text className="text-xs">{parseDate(date, true)}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Icon name="play-circle-outline" size={15} />
          <Text className="text-xs">{parseNumber(videoInfo?.playNum)}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Icon name="chat-bubble-outline" size={14} />
          <Text className="text-xs">{parseNumber(videoInfo?.danmuNum)}弹</Text>
        </View>
        <Pressable
          className="flex-row items-center gap-1"
          onPress={() => {
            showToast('不支持点赞')
          }}>
          <Icon name="thumb-up-off-alt" size={15} />
          <Text className="text-xs">{parseNumber(videoInfo?.likeNum)}</Text>
        </Pressable>
        <View className="flex-row items-center gap-1">
          <Icon name="star" size={15} />
          <Text className="text-xs">{parseNumber(videoInfo?.collectNum)}</Text>
        </View>
        <Pressable
          className="flex-row items-center"
          onPress={() => {
            if (name && title && route.params.bvid) {
              handleShareVideo(name, title, route.params.bvid)
            }
          }}>
          <Icon type="material-community" name="share" size={18} />
          <Text className="text-xs">{parseNumber(videoInfo?.shareNum)}</Text>
        </Pressable>
      </View>
    </View>
  )
}
