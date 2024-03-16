import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Text } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import React from 'react'
import { Linking } from 'react-native'

import VideoListItem from '@/components/VideoItem'
import { colors } from '@/constants/colors.tw'
import { useStore } from '@/store'
import { CollectVideoInfo, HistoryVideoInfo, RootStackParamList } from '@/types'

type Props = NativeStackScreenProps<RootStackParamList, 'History'>

function HistoryList(props: Props) {
  const { $watchedVideos } = useStore()
  React.useEffect(() => {
    const count = Object.keys($watchedVideos).length
    props.navigation.setOptions({
      headerTitle: `观看历史（${count}）`,
    })
  }, [props.navigation, $watchedVideos])
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
    return Object.values($watchedVideos).sort((a, b) => {
      return b.watchTime - a.watchTime
    })
  }, [$watchedVideos])
  return (
    <FlashList
      data={list}
      keyExtractor={v => v.bvid + ''}
      renderItem={({ item }: { item: HistoryVideoInfo }) => {
        return <VideoListItem video={item} buttons={buttons} />
      }}
      persistentScrollbar
      estimatedItemSize={100}
      ListEmptyComponent={
        <Text className="text-center text-base my-10">暂无记录</Text>
      }
      ListFooterComponent={
        list.length ? (
          <Text className={`${colors.gray6.text} text-xs text-center my-2`}>
            暂无更多（只记录最近400条）
          </Text>
        ) : null
      }
      contentContainerStyle={tw('px-1 pt-6')}
      estimatedFirstItemOffset={80}
    />
  )
}

export default React.memo(HistoryList)
