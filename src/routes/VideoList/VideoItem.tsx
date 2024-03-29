import { Icon, Text } from '@rneui/themed'
import clsx from 'clsx'
import { Image } from 'expo-image'
import React from 'react'
import { View } from 'react-native'

import type { VideoItem as VideoItemType } from '@/api/hot-videos'
import { colors } from '@/constants/colors.tw'
import { useStore } from '@/store'
import { parseDate, parseDuration, parseImgUrl, parseNumber } from '@/utils'

export default React.memo(VideoItem)

function VideoItem({ video }: { video: VideoItemType }) {
  // __DEV__ && console.log('hot video', video.title);
  const playNum = parseNumber(video.playNum)
  const { isWiFi, _followedUpsMap, $watchedVideos, $blackTags } = useStore()
  const isFollowed = video.mid in _followedUpsMap
  const watchedInfo = $watchedVideos[video.bvid]
  const isBlackTag = video.tag in $blackTags
  // console.log(parseImgUrl(video.cover, 480, 300))
  return (
    <View className="self-center   flex-1">
      <View className="flex-1">
        <Image
          className={'flex-1 w-full rounded aspect-[8/5]'}
          source={
            isWiFi
              ? parseImgUrl(video.cover, 480, 300)
              : parseImgUrl(video.cover, 320, 200)
          }
        />
        {watchedInfo ? (
          <View
            className={`absolute bottom-0 left-0 h-[6px] ${colors.secondary.bg}`}
            // @ts-expect-error in fact, react native supports use % as width unit
            style={{ width: watchedInfo.watchProgress + '%' }}
          />
        ) : null}
        <View className="absolute px-1 items-center bg-gray-900/70 rounded-sm m-1">
          <Text className="text-white text-xs">
            {parseDuration(video.duration)}
          </Text>
        </View>
        <View
          className={`${watchedInfo ? 'bottom-1' : 'bottom-0'} absolute px-1 items-center bg-gray-900/70 rounded-sm m-1`}>
          <Text className="text-white text-xs">{parseDate(video.date)}</Text>
        </View>
        <View className="top-0 right-0 absolute px-1 items-center bg-gray-900/70 rounded-sm m-1">
          <Text className="text-white text-xs">
            {parseNumber(video.danmuNum)}弹
          </Text>
        </View>
        {video.tag ? (
          <View
            className={`right-0 ${watchedInfo ? 'bottom-1' : 'bottom-0'} absolute px-1 items-center bg-gray-900/70 rounded-sm m-1`}>
            <Text
              className={clsx(
                'text-white text-xs',
                isBlackTag && 'line-through opacity-60',
              )}>
              {video.tag}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        className={clsx(
          'mt-3',
          isFollowed && ['font-bold', colors.primary.text],
        )}
        numberOfLines={2}>
        {video.title}
      </Text>
      <View className="flex-row items-center mt-2 justify-between">
        <View className="flex-row items-center shrink">
          {isFollowed ? (
            <Icon
              size={15}
              name="checkbox-marked-circle-outline"
              type="material-community"
              color={tw(colors.secondary.text).color}
            />
          ) : (
            <Image
              className="w-[13px] h-[11px]"
              source={require('../../../assets/up-mark.png')}
            />
          )}
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className={clsx(
              'ml-1 text-xs grow shrink',
              isFollowed
                ? ['font-bold', colors.secondary.text]
                : colors.primary.text,
            )}>
            {video.name}
          </Text>
        </View>
        <View className="flex-row items-center shrink-0">
          <Image
            className="w-[13px] h-[11px]"
            source={require('../../../assets/play-mark.png')}
          />
          <Text className="ml-1 text-xs text-gray-600 dark:text-gray-400">
            {playNum}
          </Text>
        </View>
      </View>
    </View>
  )
}
