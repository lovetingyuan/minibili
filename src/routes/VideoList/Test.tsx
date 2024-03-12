import { Icon, Text } from '@rneui/themed'
import { Image } from 'expo-image'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { colors } from '@/constants/colors.tw'
import { useStore } from '@/store'
import { imgUrl, parseDate, parseNumber } from '@/utils'

export function Test() {
  const video = {
    name: '无良灬杰作',
    title: '厉不厉害<em class="keyword">你坤哥</em>',
    desc: '爱坤坤爱到连视频长度都是两分半',
    cover:
      'https://i0.hdslb.com/bfs/archive/cc213d9048476dbeb999b06152e9d1f0e3d871e2.jpg',
    tag: '鬼畜剧场',
    bvid: 'BV1Xh411c7X5',
    face: 'https://i1.hdslb.com/bfs/face/35227eee7ae0acd1120827233cffc9187fdeaa13.jpg',
    date: 1684149087,
    mid: 139101964,
    aid: 228673547,
    duration: '3-4',
    danmu: 7824,
    like: 354,
    play: 4829743,
  }
  const { _followedUpsMap } = useStore()
  const isFollowed = video.mid in _followedUpsMap
  // const props = { video }
  return (
    <TouchableOpacity className="flex-row min-h-28  px-2 py-2 border">
      <View className="flex-[3] mr-3 relative justify-center content-center">
        <Image
          className="w-full rounded flex-1  h-auto"
          source={{ uri: imgUrl(video.cover, 480, 300) }}
          placeholder={require('../../../assets/video-loading.png')}
        />
        {/* <Image
          className="w-14 h-12 absolute self-center"
          source={require('../../../assets/tv.png')}
        /> */}
        <View className="absolute px-1 py-[1px] bg-gray-900/70 bottom-0 left-0 rounded-sm m-1">
          <Text className="text-xs font-thin text-white">{video.duration}</Text>
        </View>
        <View className="absolute px-1 py-[1px] top-0 rounded-sm m-1 bg-gray-900/70">
          <Text className="text-xs font-thin text-white">
            {parseDate(video.date)}
          </Text>
        </View>
        <View className="absolute px-1 py-[1px] bottom-0 right-0 m-1 rounded-sm bg-gray-900/70">
          <Text className="text-xs font-thin text-white">
            {parseNumber(video.danmu)}弹
          </Text>
        </View>
      </View>
      <View className="flex-[4] justify-between">
        <Text
          className="flex-1 text-base mb-3"
          numberOfLines={2}
          ellipsizeMode="tail">
          {video.title}
        </Text>
        <View className="gap-2">
          <Text
            className={`${isFollowed ? colors.secondary.text : colors.primary.text} ${isFollowed ? 'font-bold' : ''}`}>
            {video.name}
          </Text>
          <View className="flex-row shrink-0 min-w-20 items-center gap-x-3 flex-wrap">
            <View className="flex-row items-center gap-1">
              <Icon name="play-circle-outline" size={15} />
              <Text>{parseNumber(video.play)}</Text>
            </View>
            <View className="flex-row gap-1 items-center">
              <Icon name="thumb-up-off-alt" size={15} />
              <Text>{parseNumber(video.like)}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}
