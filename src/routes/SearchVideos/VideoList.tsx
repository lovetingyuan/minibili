import { Skeleton, Text } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import React from 'react'
import { View } from 'react-native'

import { SearchedVideoType, useSearchVideos } from '@/api/search-video'
import VideoListItem from '@/components/VideoItem'
import { colors } from '@/constants/colors.tw'

function EmptyContent(props: { loading: boolean }) {
  if (props.loading) {
    return (
      <View>
        {Array.from({ length: 20 }).map((_, i) => {
          return (
            <View
              className="flex-row items-center h-28 justify-between gap-4 mb-6 px-2"
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
        return <VideoListItem video={item} />
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
