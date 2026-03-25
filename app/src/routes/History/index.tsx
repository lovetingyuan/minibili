import { Text } from '@/components/styled/rneui'
import { FlashList } from '@/components/styled/rneui'
import React from 'react'
import { Alert, Linking, View } from 'react-native'

import VideoListItem from '@/components/VideoItem'
import { colors } from '@/constants/colors.tw'
import useResolvedColor from '@/hooks/useResolvedColor'
import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'
import { useStore } from '@/store'
import type { HistoryVideoInfo } from '@/types'

function HistoryList() {
  const { $watchedVideos, get$watchedVideos, set$watchedVideos } = useStore()
  const count = Object.keys($watchedVideos).length
  const headerTitle = `⏰ 观看历史（${count}）`
  const blackColor = useResolvedColor(colors.black.text)
  const [searchKeyWord, setSearchKeyWord] = React.useState('')
  useUpdateNavigationOptions({
    headerTitle,
    headerSearchBarOptions: {
      placeholder: '搜索视频',
      headerIconColor: blackColor,
      hintTextColor: blackColor,
      textColor: blackColor,
      tintColor: blackColor,
      disableBackButtonOverride: false,
      shouldShowHintSearchIcon: false,
      onClose: () => {
        setSearchKeyWord('')
      },
      onSearchButtonPress: ({ nativeEvent: { text } }) => {
        const keyword = text.trim()
        if (!keyword) {
          return
        }
        setSearchKeyWord(keyword)
      },
    },
  })

  const buttons = (video: HistoryVideoInfo) => {
    return [
      {
        text: '查看封面',
        onPress: () => {
          Linking.openURL(video.cover)
        },
      },
      {
        text: '删除记录',
        onPress: () => {
          Alert.alert('确定要删除这条观看记录吗？', '', [
            {
              text: '取消',
            },
            {
              text: '确定',
              onPress: () => {
                const nextWatchedVideos = { ...get$watchedVideos() }
                delete nextWatchedVideos[video.bvid]
                set$watchedVideos(nextWatchedVideos)
              },
            },
          ])
        },
      },
    ]
  }
  const list = Object.values($watchedVideos)
    .sort((a, b) => {
      return b.watchTime - a.watchTime
    })
    .filter(vi => {
      return !searchKeyWord || vi.title.includes(searchKeyWord)
    })

  return (
    <FlashList
      data={list}
      keyExtractor={v => `${v.bvid}`}
      renderItem={({ item }: { item: HistoryVideoInfo }) => {
        return <VideoListItem video={item} buttons={buttons} />
      }}
      persistentScrollbar
      estimatedItemSize={100}
      ListEmptyComponent={
        <View className="my-16 flex-1 gap-2">
          {count === 0 ? (
            <Text className="text-center text-base">暂无观看记录</Text>
          ) : (
            <Text className="text-center text-base">无搜索结果</Text>
          )}
        </View>
      }
      ListFooterComponent={
        list.length ? (
          <Text className={`${colors.gray6.text} my-2 text-center text-xs`}>
            暂无更多（保存最近约420条）
          </Text>
        ) : null
      }
      contentContainerClassName="px-1 pt-6"
      estimatedFirstItemOffset={80}
    />
  )
}

export default HistoryList
