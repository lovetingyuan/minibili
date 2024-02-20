import React from 'react'
import { View, ScrollView, Pressable } from 'react-native'
import { Text } from '@rneui/themed'
import * as Clipboard from 'expo-clipboard'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../types'
import Player from './Player'
import { useVideoInfo } from '../../api/video-info'
import CommentList from '../../components/CommentList'
import VideoInfo from './VideoInfo'
import { showToast } from '../../utils'
import { useFocusEffect } from '@react-navigation/native'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import { setViewingVideoId } from '../../utils/report'
import PlayHeader from './Header'

// https://www.bilibili.com/blackboard/html5mobileplayer.html?&bvid=BV1aX4y1B7n7&cid=1103612055&wmode=transparent&as_wide=1&crossDomain=1&lite=0&danmaku=0
// https://www.bilibili.com/blackboard/newplayer.html?crossDomain=true&bvid=BV1cB4y1n7v8&as_wide=1&page=1&autoplay=0&poster=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?danmaku=1&highQuality=0&bvid=BV1cB4y1n7v8
// https://player.bilibili.com/player.html?aid=899458592&bvid=BV1BN4y1G7tx&cid=802365081&page=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=BV1BN4y1G7tx&page=1&posterFirst=1

type Props = NativeStackScreenProps<RootStackParamList, 'Play'>

export default React.memo(function Play({ route, navigation }: Props) {
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
        <VideoInfo currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <View className="mt-4">
          <CommentList
            upName={videoInfo?.name || ''}
            commentId={videoInfo?.aid || ''}
            commentType={1}
            dividerRight={
              <View className="flex-row items-center">
                <Pressable
                  onPress={() => {
                    Clipboard.setStringAsync(bvid).then(() => {
                      showToast('已复制视频ID')
                    })
                  }}>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {bvid}
                  </Text>
                </Pressable>
                <Text className="text-base font-bold text-gray-500 dark:text-gray-400">
                  {' · '}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {videoInfo?.tag}
                </Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  )
})
