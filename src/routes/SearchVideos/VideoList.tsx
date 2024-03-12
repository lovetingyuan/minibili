import { useNavigation } from '@react-navigation/native'
import { Icon, Skeleton, Text } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { SearchedVideoType, useSearchVideos } from '@/api/search-video'
import { colors } from '@/constants/colors.tw'
import { useStore } from '@/store'
import { NavigationProps } from '@/types'
import { imgUrl, parseDate, parseNumber } from '@/utils'

function SearchVideoItem({ video }: { video: SearchedVideoType }) {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { _followedUpsMap } = useStore()

  const isFollowed = video.mid in _followedUpsMap
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        navigation.navigate('Play', {
          aid: video.aid,
          bvid: video.bvid,
          title: video.title,
          desc: video.desc,
          mid: video.mid,
          face: video.face,
          name: video.name,
          cover: video.cover,
          date: video.date,
          tag: video.tag,
        })
      }}
      className="flex-row min-h-28 px-2 py-2 mb-4">
      <View className="flex-[3] mr-3 relative justify-center content-center">
        <Image
          className="w-full rounded flex-1  h-auto"
          source={{ uri: imgUrl(video.cover, 480, 300) }}
          placeholder={require('../../../assets/video-loading.png')}
        />
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
            {parseNumber(video.danmaku)}弹
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
              <Icon
                name="play-circle-outline"
                size={15}
                color={tw(colors.gray6.text).color}
              />
              <Text className={colors.gray6.text}>
                {parseNumber(video.play)}
              </Text>
            </View>
            <View className="flex-row gap-1 items-center">
              <Icon
                name="thumb-up-off-alt"
                color={tw(colors.gray6.text).color}
                size={15}
              />
              <Text className={colors.gray6.text}>
                {parseNumber(video.like)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

function EmptyContent(props: { loading: boolean }) {
  if (props.loading) {
    return (
      <View>
        {Array.from({ length: 20 }).map((_, i) => {
          return (
            <View
              className="flex-row items-center h-28 justify-between gap-4 mb-6 px-4"
              key={i}>
              <Skeleton
                animation="pulse"
                className="flex-[3] rounded h-[90%]  my-2"
              />
              <View className="py-2 flex-[4]">
                <View className="flex-1 gap-2">
                  <Skeleton animation="wave" width={150} height={16} />
                  <Skeleton animation="wave" width={50} height={16} />
                </View>
                <View className="gap-2">
                  <Skeleton animation="wave" width={80} height={14} />
                  <View className="flex-row gap-2">
                    <Skeleton animation="wave" width={50} height={12} />
                    <Skeleton animation="wave" width={40} height={12} />
                  </View>
                </View>
              </View>
            </View>
          )
        })}
      </View>
    )
  }
  return <Text className="text-center my-10">暂无结果</Text>
}

function VideoList(props: { keyword: string }) {
  const {
    data: searchedVideos,
    isLoading,
    update,
    isReachingEnd,
    isValidating,
  } = useSearchVideos(props.keyword)
  return (
    <FlashList
      data={searchedVideos}
      keyExtractor={v => v.bvid + ''}
      renderItem={({ item }: { item: SearchedVideoType }) => {
        return <SearchVideoItem video={item} />
      }}
      persistentScrollbar
      estimatedItemSize={100}
      ListEmptyComponent={<EmptyContent loading={isLoading} />}
      ListFooterComponent={
        isValidating ? (
          <Text className={`${colors.gray6.text} text-xs text-center my-2`}>
            加载中~
          </Text>
        ) : searchedVideos?.length && isReachingEnd ? (
          <Text className={`${colors.gray6.text} text-xs text-center my-2`}>
            暂无更多
          </Text>
        ) : null
      }
      contentContainerStyle={tw('px-1 pt-6')}
      estimatedFirstItemOffset={80}
      onEndReached={() => {
        update()
      }}
      onEndReachedThreshold={1}
    />
  )
}

export default React.memo(VideoList)
