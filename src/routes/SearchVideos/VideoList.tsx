import { Skeleton, Text } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import React from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'

import { useHotSearch } from '@/api/hot-search'
import { type SearchedVideoType, useSearchVideos } from '@/api/search-video'
import Image2 from '@/components/Image2'
import VideoListItem from '@/components/VideoItem'
import { colors } from '@/constants/colors.tw'
import { parseImgUrl } from '@/utils'

function EmptyContent(props: {
  loading: boolean
  onSearch: (k: string) => void
}) {
  const hotSearchList = useHotSearch()
  if (props.loading) {
    return (
      <View>
        {Array.from({ length: 20 }).map((_, i) => {
          return (
            <View
              className="flex-row items-center h-28 justify-between gap-4 mb-4 px-2"
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
  return (
    <ScrollView className="mb-4">
      {hotSearchList ? (
        hotSearchList.map((hot) => {
          return (
            <TouchableOpacity
              key={hot.hot_id}
              activeOpacity={0.7}
              onPress={() => {
                props.onSearch(hot.keyword)
              }}
              className="flex-1 flex-row p-2 mx-2 my-1 items-center">
              <Text className="text-base">{hot.position}. </Text>
              <Text className="text-base">{hot.show_name}</Text>
              {hot.icon ? (
                <Image2
                  source={{ uri: parseImgUrl(hot.icon) }}
                  style={{ height: 16 }}
                  className="ml-1"
                />
              ) : null}
            </TouchableOpacity>
          )
        })
      ) : (
        <Text className="text-center my-20 text-base">暂无结果</Text>
      )}
    </ScrollView>
  )
}

function VideoList(props: { keyword: string; onSearch: (k: string) => void }) {
  const {
    data: searchedVideos,
    isLoading,
    update,
    isReachingEnd,
    isValidating,
  } = useSearchVideos(props.keyword)
  const listRef = React.useRef<FlashList<any> | null>(null)
  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToOffset({ offset: 0 })
    }
  }, [props.keyword])
  return (
    <FlashList
      data={searchedVideos}
      keyExtractor={(v) => v.bvid}
      ref={listRef}
      renderItem={({ item }: { item: SearchedVideoType }) => {
        return <VideoListItem video={item} />
      }}
      persistentScrollbar
      estimatedItemSize={100}
      ListEmptyComponent={
        <EmptyContent loading={isLoading} onSearch={props.onSearch} />
      }
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
      contentContainerStyle={tw('px-1 pt-4')}
      estimatedFirstItemOffset={80}
      onEndReached={() => {
        update()
      }}
      onEndReachedThreshold={1}
    />
  )
}

export default React.memo(VideoList)
