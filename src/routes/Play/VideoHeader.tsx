import {
  type RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native'
import { Avatar, Icon, Text } from '@rneui/themed'
import { Image } from 'expo-image'
import React from 'react'
import { Alert, Linking, Pressable, TouchableOpacity, View } from 'react-native'

import { useWatchingCount } from '@/api/watching-count'
import { colors } from '@/constants/colors.tw'
import { useStore } from '@/store'

import { useVideoInfo } from '../../api/video-info'
import type { NavigationProps, RootStackParamList } from '../../types'
import {
  handleShareVideo,
  parseDate,
  parseImgUrl,
  parseNumber,
  showToast,
} from '../../utils'

export default React.memo(VideoHeader)

function VideoHeader() {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const route = useRoute<RouteProp<RootStackParamList, 'Play'>>()
  const { data } = useVideoInfo(route.params.bvid)
  const videoInfo = {
    ...route.params,
    ...data,
  }
  const { name, face, mid, date, title } = videoInfo
  const watchingCount = useWatchingCount(videoInfo.bvid, videoInfo.cid!)
  const { _collectedVideosMap, set$collectedVideos, get$collectedVideos } =
    useStore()
  const isCollected = videoInfo.bvid && videoInfo.bvid in _collectedVideosMap
  const collectVideo = () => {
    if (typeof videoInfo?.collectNum !== 'number') {
      return
    }
    if (isCollected) {
      Alert.alert('是否取消收藏？', '', [
        {
          text: '否',
        },
        {
          text: '是',
          onPress: () => {
            const list = get$collectedVideos()
            set$collectedVideos(list.filter(vi => vi.bvid !== videoInfo.bvid))
          },
        },
      ])
    } else {
      const list = get$collectedVideos()
      set$collectedVideos([
        {
          bvid: videoInfo.bvid,
          name: videoInfo.name!,
          title: videoInfo.title,
          cover: videoInfo.cover!,
          date: videoInfo.date!,
          duration: videoInfo.duration!,
          mid: videoInfo.mid!,
        },
        ...list,
      ])
      showToast('已收藏')
    }
  }

  return (
    <View className="items-center flex-wrap justify-between shrink-0 gap-3">
      {videoInfo?.argument ? (
        <View className="p-2 self-start">
          <Text
            className={`${colors.warning.text}`}
            onPress={() => {
              if (videoInfo.argumentLink) {
                Linking.openURL(videoInfo.argumentLink)
              }
            }}>
            ⚠️ {videoInfo.argument}
          </Text>
        </View>
      ) : null}
      <View className="justify-between flex-row">
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
            size={36}
            rounded
            source={
              face
                ? {
                    uri: parseImgUrl(face, 80),
                  }
                : require('../../../assets/loading.png')
            }
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
      <View className="flex-row w-full my-1 justify-start flex-wrap">
        <View className="flex-row items-center gap-1 pr-1 py-1">
          <Icon name="play-circle-outline" size={18} />
          <Text className="text-sm">{parseNumber(videoInfo?.playNum)}</Text>
        </View>
        <View className="flex-row items-center gap-1 px-2 py-1">
          <Icon name="chat-bubble-outline" size={16} />
          <Text className="text-sm">{parseNumber(videoInfo?.danmuNum)}弹</Text>
        </View>
        <Pressable
          className="flex-row items-center gap-1 px-2 py-1"
          onPress={() => {
            showToast(`${videoInfo?.likeNum} 点赞`)
          }}>
          <Icon name="thumb-up-off-alt" size={18} />
          <Text className="text-sm">{parseNumber(videoInfo?.likeNum)}</Text>
        </Pressable>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={collectVideo}
          className="flex-row items-center gap-1 px-2 py-1">
          <Icon
            name="star"
            size={18}
            color={
              tw(isCollected ? colors.warning.text : colors.gray8.text).color
            }
          />
          <Text
            className={`text-sm ${isCollected ? colors.warning.text : colors.gray8.text} ${isCollected ? 'font-bold' : ''}`}>
            {parseNumber(videoInfo?.collectNum)}
          </Text>
        </TouchableOpacity>
        <Pressable
          className="flex-row items-center gap-1 pl-2 py-1"
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
