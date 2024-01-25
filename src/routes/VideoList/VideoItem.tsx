import React from 'react'
import { View, useWindowDimensions } from 'react-native'
import { VideoItem } from '../../api/hot-videos'
import { imgUrl, parseDate, parseDuration, parseNumber } from '../../utils'
import { useTheme, Text } from '@rneui/themed'
import { Image } from 'expo-image'
import { useStore } from '../../store'

export default React.memo(function HotItem({ video }: { video: VideoItem }) {
  // __DEV__ && console.log('hot video', video.title);
  const playNum = parseNumber(video.playNum)
  const { theme } = useTheme()
  const { width } = useWindowDimensions()
  const itemWidth = (width - 24) / 2
  const { isWiFi, _followedUpsMap } = useStore()
  return (
    <View className="my-3 self-center" style={{ width: itemWidth }}>
      <View className="flex-1">
        <Image
          className="flex-1 w-full rounded aspect-[8/5]"
          source={imgUrl(video.cover, ...(isWiFi ? [480, 300] : [320, 200]))}
        />
        <View className=" absolute px-1 items-center bg-gray-900/70 rounded-sm m-1">
          <Text className="text-white text-xs">
            {parseDuration(video.duration)}
          </Text>
        </View>
        <View className="bottom-0 absolute px-1 items-center bg-gray-900/70 rounded-sm m-1">
          <Text className="text-white text-xs">{parseDate(video.date)}</Text>
        </View>
        {video.tag ? (
          <View className="right-0 bottom-0 absolute px-1 items-center bg-gray-900/70 rounded-sm m-1">
            <Text className="text-white text-xs">{video.tag}</Text>
          </View>
        ) : null}
      </View>
      <Text className="mt-3 min-h-8" numberOfLines={2}>
        {video.title}
      </Text>
      <View className="flex-row items-center mt-2 justify-between">
        <View className="flex-row items-center shrink">
          <Image
            className="w-[13px] h-[11px]"
            source={require('../../../assets/up-mark.png')}
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className={`ml-1 text-xs grow shrink ${
              video.mid in _followedUpsMap ? 'font-bold' : ''
            }`}
            style={{
              color:
                video.mid in _followedUpsMap
                  ? theme.colors.secondary
                  : theme.colors.primary,
            }}>
            {video.name}
          </Text>
        </View>
        <View className="flex-row items-center shrink-0">
          <Image
            className="w-[13px] h-[11px]"
            source={require('../../../assets/play-mark.png')}
          />
          <Text className="ml-1 text-xs" style={{ color: theme.colors.grey1 }}>
            {playNum}
          </Text>
        </View>
      </View>
    </View>
  )
})
