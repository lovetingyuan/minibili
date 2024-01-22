import React from 'react'
import { StyleSheet, View, ScrollView, Pressable } from 'react-native'
import { Text, useTheme } from '@rneui/themed'
import * as Clipboard from 'expo-clipboard'

// https://www.bilibili.com/blackboard/html5mobileplayer.html?&bvid=BV1aX4y1B7n7&cid=1103612055&wmode=transparent&as_wide=1&crossDomain=1&lite=0&danmaku=0
// https://www.bilibili.com/blackboard/newplayer.html?crossDomain=true&bvid=BV1cB4y1n7v8&as_wide=1&page=1&autoplay=0&poster=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?danmaku=1&highQuality=0&bvid=BV1cB4y1n7v8
// https://player.bilibili.com/player.html?aid=899458592&bvid=BV1BN4y1G7tx&cid=802365081&page=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=BV1BN4y1G7tx&page=1&posterFirst=1

import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../types'
import Player from './Player'
import { useVideoInfo } from '../../api/video-info'
import CommentList from '../../components/CommentList'
import VideoInfo from './VideoInfo'
import { parseNumber, showToast } from '../../utils'
import { useFocusEffect } from '@react-navigation/native'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import { setViewingVideoId } from '../../utils/report'
// import { s } from '../../styles'
import { useUserRelation } from '../../api/user-relation'

type Props = NativeStackScreenProps<RootStackParamList, 'Play'>

export default React.memo(function PlayPage({ route, navigation }: Props) {
  const { bvid } = route.params
  const [currentPage, setCurrentPage] = React.useState(1)
  const { data: videoInfo } = useVideoInfo(bvid, route.params)
  const { theme } = useTheme()

  const { data: fans } = useUserRelation(videoInfo?.mid)

  React.useEffect(() => {
    if (videoInfo?.name) {
      navigation.setOptions({
        headerTitle: () => {
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>
                {videoInfo?.name}
              </Text>
              <Text style={{ marginLeft: 10, color: theme.colors.grey2 }}>
                {` ${fans ? parseNumber(fans.follower) : ''}粉丝`}
              </Text>
            </View>
          )
        },
      })
    }
  }, [navigation, videoInfo?.name, fans, theme.colors.grey2])
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
      <Player page={currentPage} bvid={bvid} />
      <ScrollView style={styles.videoInfoContainer}>
        <VideoInfo changePage={setCurrentPage} bvid={bvid} page={currentPage} />
        <View className="mt-4">
          <CommentList
            upName={videoInfo?.name || ''}
            commentId={videoInfo?.aid || ''}
            commentType={1}
            dividerRight={
              <View style={styles.right}>
                <Pressable
                  onPress={() => {
                    Clipboard.setStringAsync(bvid).then(() => {
                      showToast('已复制视频ID')
                    })
                  }}>
                  <Text
                    style={{ color: theme.colors.grey1 }}
                    className="text-sm">
                    {bvid}
                  </Text>
                </Pressable>
                <Text
                  className="text-sm font-bold"
                  style={{ color: theme.colors.grey1 }}>
                  {' · '}
                </Text>
                <Text className="text-sm" style={{ color: theme.colors.grey1 }}>
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

const styles = StyleSheet.create({
  videoInfoContainer: { paddingVertical: 18, paddingHorizontal: 12 },
  right: { flexDirection: 'row', alignItems: 'center' },
})
