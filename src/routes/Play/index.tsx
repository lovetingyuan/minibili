import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Text } from '@rneui/themed'
import * as Clipboard from 'expo-clipboard'
import React from 'react'
import { ScrollView, View } from 'react-native'

import { useVideoInfo } from '../../api/video-info'
import CommentList from '../../components/CommentList'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import type { RootStackParamList } from '../../types'
import { showToast } from '../../utils'
import { setViewingVideoId } from '../../utils/report'
import PlayHeader from './Header'
import Player from './Player'
import VideoHeader from './VideoHeader'
import VideoInfo from './VideoInfo'

// https://www.bilibili.com/blackboard/html5mobileplayer.html?&bvid=BV1aX4y1B7n7&cid=1103612055&wmode=transparent&as_wide=1&crossDomain=1&lite=0&danmaku=0
// https://www.bilibili.com/blackboard/newplayer.html?crossDomain=true&bvid=BV1cB4y1n7v8&as_wide=1&page=1&autoplay=0&poster=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?danmaku=1&highQuality=0&bvid=BV1cB4y1n7v8
// https://player.bilibili.com/player.html?aid=899458592&bvid=BV1BN4y1G7tx&cid=802365081&page=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=BV1BN4y1G7tx&page=1&posterFirst=1

type Props = NativeStackScreenProps<RootStackParamList, 'Play'>

export default React.memo(Play)

function Play({ route, navigation }: Props) {
  const { bvid } = route.params
  const [currentPage, setCurrentPage] = React.useState(1)
  const { data } = useVideoInfo(bvid)
  const videoInfo = {
    ...data,
    ...route.params,
  }
  React.useEffect(() => {
    const headerTitle = () => <PlayHeader />
    navigation.setOptions({
      headerTitle,
    })
  }, [navigation])
  useFocusEffect(
    useMemoizedFn(() => {
      setViewingVideoId(bvid)
      return () => {
        setViewingVideoId(null)
      }
    }),
  )

  return (
    <View className="flex-1">
      <Player currentPage={currentPage} />
      <ScrollView className="py-4 px-3">
        <VideoHeader />
        <VideoInfo currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <CommentList
          upName={videoInfo?.name || ''}
          commentId={videoInfo?.aid || ''}
          commentType={1}
          dividerRight={
            <View className="flex-row items-center">
              <Text
                onPress={() => {
                  Clipboard.setStringAsync(bvid).then(() => {
                    showToast('已复制视频ID')
                  })
                }}
                className="text-xs text-gray-500 dark:text-gray-400">
                {bvid}
              </Text>
              <Text className="text-base font-bold text-gray-500 dark:text-gray-400">
                {' · '}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {videoInfo?.tag}
              </Text>
            </View>
          }
        />
      </ScrollView>
    </View>
  )
}
