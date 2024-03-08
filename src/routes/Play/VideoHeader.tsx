import {
  type RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native'
import { Avatar, Icon, Text } from '@rneui/themed'
import { Image } from 'expo-image'
import React from 'react'
import { Pressable, View } from 'react-native'

import { useWatchingCount } from '@/api/watching-count'

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
  const watchingCount = useWatchingCount(videoInfo.bvid, videoInfo.cid!)
  return (
    <View className="items-center flex-wrap justify-between flex-1 shrink-0 gap-3">
      <View className="flex-1 justify-between flex-row w-full">
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
          className="flex-row flex-1 items-center mr-2">
          <Avatar
            size={40}
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
            className="ml-3 grow text-base font-bold">
            {name ? name + '  ' : ' '}
          </Text>
        </Pressable>
        <View className="flex-row items-center gap-1 px-2 flex-none">
          <Icon name="date-range" size={16} />
          <Text className="text-sm">{parseDate(date, true)}</Text>
          {watchingCount ? (
            <Text className="text-sm ml-1">
              {watchingCount.total === '1' ? '壹' : watchingCount.total}
              人在看
            </Text>
          ) : null}
        </View>
      </View>
      <View className="flex-row w-full shrink-0 my-1 justify-start gap-x-4 gap-y-2 flex-1 flex-wrap">
        {/* <View className="flex-row items-center gap-1">
          <Icon name="date-range" size={18} />
          <Text className="text-sm">{parseDate(date, true)}</Text>
        </View> */}
        <View className="flex-row items-center gap-1">
          <Icon name="play-circle-outline" size={18} />
          <Text className="text-sm">{parseNumber(videoInfo?.playNum)}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Icon name="chat-bubble-outline" size={16} />
          <Text className="text-sm">{parseNumber(videoInfo?.danmuNum)}弹</Text>
        </View>
        <Pressable
          className="flex-row items-center gap-1"
          onPress={() => {
            showToast(`${videoInfo?.likeNum} 点赞`)
          }}>
          <Icon name="thumb-up-off-alt" size={18} />
          <Text className="text-sm">{parseNumber(videoInfo?.likeNum)}</Text>
        </Pressable>
        <View className="flex-row items-center gap-1">
          <Icon name="star" size={18} />
          <Text className="text-sm">{parseNumber(videoInfo?.collectNum)}</Text>
        </View>
        <Pressable
          className="flex-row items-center mr-2"
          onPress={() => {
            if (name && title && route.params.bvid) {
              handleShareVideo(name, title, route.params.bvid)
            }
          }}>
          <Icon type="material-community" name="share" size={22} />
          <Text className="text-sm">{parseNumber(videoInfo?.shareNum)}</Text>
        </Pressable>
      </View>
    </View>
  )
}
