import { Text } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import React from 'react'
import { Linking, View } from 'react-native'

import VideoListItem from '@/components/VideoItem'
import { colors } from '@/constants/colors.tw'
import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'
import { useStore } from '@/store'
import type { CollectVideoInfo, HistoryVideoInfo } from '@/types'

function HistoryList() {
  const { $watchedVideos } = useStore()
  const count = Object.keys($watchedVideos).length
  const headerTitle = `⏰ 观看历史（${count}）`
  const blackColor = tw(colors.black.text).color
  const [searchKeyWord, setSearchKeyWord] = React.useState('')
  useUpdateNavigationOptions(
    React.useMemo(() => {
      return {
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
      }
    }, [headerTitle, blackColor]),
  )

  const buttons = (video: CollectVideoInfo) => {
    return [
      {
        text: '查看封面',
        onPress: () => {
          Linking.openURL(video.cover)
        },
      },
    ]
  }
  const list = React.useMemo(() => {
    const _list = Object.values($watchedVideos).sort((a, b) => {
      return b.watchTime - a.watchTime
    })
    if (searchKeyWord) {
      return _list.filter((vi) => {
        return vi.title.includes(searchKeyWord)
      })
    }
    return _list
  }, [$watchedVideos, searchKeyWord])

  return (
    <FlashList
      data={list}
      keyExtractor={(v) => `${v.bvid}`}
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
      contentContainerStyle={tw('px-1 pt-6')}
      estimatedFirstItemOffset={80}
    />
  )
}

export default React.memo(HistoryList)
