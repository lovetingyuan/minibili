import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Text } from '@rneui/themed'
import * as Clipboard from 'expo-clipboard'
import React from 'react'
import { View } from 'react-native'

import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'

import { useVideoInfo } from '../../api/video-info'
import CommentList from '../../components/CommentList'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import type { RootStackParamList } from '../../types'
import { showToast } from '../../utils'
import { setViewingVideoId } from '../../utils/report'
import { PlayHeaderRight, PlayHeaderTitle } from './Header'
import Player from './Player'
import VideoHeader from './VideoHeader'
import VideoInfo from './VideoInfo'

// https://www.bilibili.com/blackboard/webplayer/mbplayer.html?aid=1501398719&bvid=BV1HS421w7wG&cid=1458260037&p=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?&bvid=BV1aX4y1B7n7&cid=1103612055&wmode=transparent&as_wide=1&crossDomain=1&lite=0&danmaku=0
// https://www.bilibili.com/blackboard/newplayer.html?crossDomain=true&bvid=BV1cB4y1n7v8&as_wide=1&page=1&autoplay=0&poster=1
// https://player.bilibili.com/player.html?aid=899458592&bvid=BV1BN4y1G7tx&cid=802365081&page=1

type Props = NativeStackScreenProps<RootStackParamList, 'Play'>

export default React.memo(Play)

function Play({ route }: Props) {
  const { bvid } = route.params
  const [currentPage, setCurrentPage] = React.useState(1)
  const { data } = useVideoInfo(bvid)
  const videoInfo = {
    ...route.params,
    ...data,
  }
  const [currentCid, setCurrentCid] = React.useState(videoInfo.cid)
  React.useEffect(() => {
    if (videoInfo.cid && !currentCid) {
      setCurrentCid(videoInfo.cid)
    }
  }, [videoInfo.cid, currentCid])
  const [key, setKey] = React.useState(bvid)

  useUpdateNavigationOptions(
    React.useMemo(() => {
      const headerTitle = () => <PlayHeaderTitle />
      const headerRight = () => (
        <PlayHeaderRight
          cid={currentCid}
          refresh={() => {
            setKey(k => k + 1)
          }}
        />
      )
      return {
        headerTitle,
        headerRight,
      }
    }, [currentCid]),
  )

  useFocusEffect(
    useMemoizedFn(() => {
      setViewingVideoId(bvid)
      return () => {
        setViewingVideoId(null)
      }
    }),
  )

  return (
    <View className="flex-1" key={key}>
      <Player currentPage={currentPage} currentCid={currentCid} />
      <CommentList
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
        }>
        <VideoHeader />
        <VideoInfo
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setCurrentCid={setCurrentCid}
        />
      </CommentList>
    </View>
  )
}
