import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Text } from '@rn-vui/themed'
import * as Clipboard from 'expo-clipboard'
import React from 'react'
import { Alert, View } from 'react-native'

import useUpdateNavigationOptions from '@/hooks/useUpdateNavigationOptions'

import { useVideoInfo } from '../../api/video-info'
import CommentList from '../../components/CommentList'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import type { RootStackParamList } from '../../types'
import { showToast } from '../../utils'
import { PlayHeaderRight, PlayHeaderTitle } from './Header'
import Player from './Player'
import VideoInfo from './VideoInfo'

// https://www.bilibili.com/blackboard/webplayer/mbplayer.html?aid=1501398719&bvid=BV1HS421w7wG&cid=1458260037&p=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?&bvid=BV1aX4y1B7n7&cid=1103612055&wmode=transparent&as_wide=1&crossDomain=1&lite=0&danmaku=0
// https://www.bilibili.com/blackboard/newplayer.html?crossDomain=true&bvid=BV1cB4y1n7v8&as_wide=1&page=1&autoplay=0&poster=1
// https://player.bilibili.com/player.html?aid=899458592&bvid=BV1BN4y1G7tx&cid=802365081&page=1

type Props = NativeStackScreenProps<RootStackParamList, 'Play'>

export default React.memo(Play)

function Play({ route }: Props) {
  const { bvid } = route.params

  const { data, error } = useVideoInfo(bvid)
  const videoInfo = {
    ...route.params,
    ...data,
  }
  const [currentPage, setCurrentPage] = React.useState(1)
  const cid2 = videoInfo.pages ? videoInfo.pages[currentPage - 1].cid : 0

  const errorShowedRef = React.useRef(false)

  React.useEffect(() => {
    if (!errorShowedRef.current && error) {
      errorShowedRef.current = true
      Alert.alert(
        '抱歉，出错了',
        '\n获取当前视频信息失败，无法播放\n可能是由于UP删除、设为私密或者涉及违规等',
      )
    }
  }, [error])

  const [key, setKey] = React.useState(bvid)

  useUpdateNavigationOptions(
    React.useMemo(() => {
      const headerTitle = () => <PlayHeaderTitle />
      const headerRight = () => (
        <PlayHeaderRight
          cid={cid2}
          refresh={() => {
            setKey((k) => k + 1)
          }}
        />
      )
      return {
        headerTitle,
        headerRight,
      }
    }, [cid2]),
  )

  const handlePlayEnd = useMemoizedFn(() => {
    if (videoInfo.pages && currentPage < videoInfo.pages.length) {
      setCurrentPage(currentPage + 1)
    }
  })

  return (
    <View className="flex-1" key={key}>
      <Player currentPage={currentPage} onPlayEnded={handlePlayEnd} />
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
        <VideoInfo currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </CommentList>
    </View>
  )
}
