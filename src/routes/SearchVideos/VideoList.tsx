import { Skeleton, Text } from '@rn-vui/themed'
import { FlashList } from '@shopify/flash-list'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { useHotSearch } from '@/api/hot-search'
import { type SearchedVideoType, useSearchVideos } from '@/api/search-video'
import Image2 from '@/components/Image2'
import VideoListItem from '@/components/VideoItem'
import { colors } from '@/constants/colors.tw'
import { useStore } from '@/store'
import { parseImgUrl } from '@/utils'

function EmptyContent(props: {
  loading: boolean
  onSearch: (k: string) => void
}) {
  const hotSearchList = useHotSearch()
  const { $watchedHotSearch } = useStore()
  if (props.loading) {
    return (
      <View>
        {Array.from({ length: 20 }).map((_, i) => {
          return (
            <View
              className="mb-4 h-28 flex-row items-center justify-between gap-4 px-2"
              key={i}>
              <Skeleton
                animation="pulse"
                className="my-2 h-[90%] flex-[3] rounded"
              />
              <View className="flex-[4] py-2">
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
  if (hotSearchList?.length) {
    return (
      <>
        {hotSearchList.map((hot) => {
          return (
            <TouchableOpacity
              key={hot.hot_id}
              activeOpacity={0.7}
              onPress={() => {
                props.onSearch(hot.keyword)
              }}
              className="mx-2 my-1 flex-1 flex-row items-center p-2">
              <Text
                className={`text-base ${hot.keyword in $watchedHotSearch ? 'opacity-40' : ''}`}>
                {hot.position}.{' '}
              </Text>
              <Text
                className={`text-base ${hot.keyword in $watchedHotSearch ? 'opacity-40' : ''}`}>
                {hot.show_name}
              </Text>
              {hot.icon ? (
                <Image2
                  source={{ uri: parseImgUrl(hot.icon) }}
                  style={{ height: 16 }}
                  className="ml-1"
                />
              ) : null}
            </TouchableOpacity>
          )
        })}
        <Text className="my-2" />
      </>
    )
  }
  return <Text className="my-20 text-center text-base">暂无结果</Text>
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
          <Text className={`${colors.gray6.text} my-2 text-center text-xs`}>
            加载中~
          </Text>
        ) : searchedVideos?.length && isReachingEnd ? (
          <Text className={`${colors.gray6.text} my-2 text-center text-xs`}>
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
