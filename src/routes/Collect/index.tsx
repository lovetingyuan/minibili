import { Text } from '@rn-vui/themed'
import { FlashList } from '@shopify/flash-list'
import React from 'react'
import { Alert, Linking, View } from 'react-native'

import VideoListItem from '@/components/VideoItem'
import { colors } from '@/constants/colors.tw'
import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'
import { useStore } from '@/store'
import type { CollectVideoInfo } from '@/types'

function CollectList() {
  const { $collectedVideos, set$collectedVideos } = useStore()
  const headerTitle = `⭐️ 我的收藏（${$collectedVideos.length}）`
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
      {
        text: '取消收藏',
        onPress: () => {
          Alert.alert('是否取消收藏？', '', [
            {
              text: '否',
            },
            {
              text: '是',
              onPress: () => {
                set$collectedVideos(
                  $collectedVideos.filter((v) => v.bvid !== video.bvid),
                )
              },
            },
          ])
        },
      },
    ]
  }
  const collectVideos = React.useMemo(() => {
    if (searchKeyWord) {
      return $collectedVideos.filter((vi) => {
        return vi.title.includes(searchKeyWord)
      })
    }
    return $collectedVideos
  }, [searchKeyWord, $collectedVideos])
  return (
    <FlashList
      data={collectVideos}
      keyExtractor={(v) => v.bvid}
      renderItem={({ item }: { item: CollectVideoInfo }) => {
        return <VideoListItem video={item} buttons={buttons} />
      }}
      persistentScrollbar
      estimatedItemSize={100}
      ListEmptyComponent={
        <View className="my-16 flex-1 gap-2">
          {$collectedVideos.length === 0 ? (
            <Text className="text-center text-base">
              暂无收藏{'\n\n'}在视频播放页点击⭐收藏按钮
            </Text>
          ) : (
            <Text className="text-center text-base">无搜索结果</Text>
          )}
        </View>
      }
      ListFooterComponent={
        collectVideos.length ? (
          <Text className={`${colors.gray6.text} my-2 text-center text-xs`}>
            暂无更多
          </Text>
        ) : null
      }
      contentContainerStyle={tw('px-1 pt-6')}
      estimatedFirstItemOffset={80}
    />
  )
}

export default React.memo(CollectList)
