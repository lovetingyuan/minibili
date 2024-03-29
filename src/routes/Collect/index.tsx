import { Text } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import React from 'react'
import { Alert, Linking } from 'react-native'

import VideoListItem from '@/components/VideoItem'
import { colors } from '@/constants/colors.tw'
import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'
import { useStore } from '@/store'
import { CollectVideoInfo } from '@/types'

function CollectList() {
  const { $collectedVideos, set$collectedVideos } = useStore()
  const headerTitle = `我的收藏（${$collectedVideos.length}）`
  useUpdateNavigationOptions(
    React.useMemo(() => {
      return {
        headerTitle,
      }
    }, [headerTitle]),
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
                  $collectedVideos.filter(v => v.bvid !== video.bvid),
                )
              },
            },
          ])
        },
      },
    ]
  }
  return (
    <FlashList
      data={$collectedVideos}
      keyExtractor={v => v.bvid + ''}
      renderItem={({ item }: { item: CollectVideoInfo }) => {
        return <VideoListItem video={item} buttons={buttons} />
      }}
      persistentScrollbar
      estimatedItemSize={100}
      ListEmptyComponent={
        <Text className="text-center text-base my-10">暂无收藏</Text>
      }
      ListFooterComponent={
        $collectedVideos.length ? (
          <Text className={`${colors.gray6.text} text-xs text-center my-2`}>
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
