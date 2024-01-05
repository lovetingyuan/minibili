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
// import VideoInfoContext from './videoContext'
import { useFocusEffect } from '@react-navigation/native'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import { setViewingVideoId } from '../../utils/report'
import commonStyles from '../../styles'
import { useUserRelation } from '../../api/user-relation'
import { useStore } from '../../store'

type Props = NativeStackScreenProps<RootStackParamList, 'Play'>

export default React.memo(function PlayPage({ route, navigation }: Props) {
  const { video, bvid } = route.params
  const [currentPage, setCurrentPage] = React.useState(1)
  const { data: video2 } = useVideoInfo(bvid)
  const { theme } = useTheme()
  const { setPlayingVideo } = useStore()
  const videoInfo = React.useMemo(() => {
    return {
      ...video,
      ...video2,
      bvid,
    }
  }, [bvid, video, video2])
  const { data: fans } = useUserRelation(videoInfo?.mid)

  React.useEffect(() => {
    if (videoInfo.name) {
      navigation.setOptions({
        headerTitle: () => {
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>
                {videoInfo.name}
              </Text>
              <Text style={{ marginLeft: 10 }}>
                {` ${fans ? parseNumber(fans.follower) : ''}粉丝`}
              </Text>
            </View>
          )
        },
      })
    }
  }, [navigation, videoInfo.name, fans])
  useFocusEffect(
    useMemoizedFn(() => {
      setViewingVideoId(bvid)
      return () => {
        setViewingVideoId(null)
      }
    }),
  )
  React.useEffect(() => {
    // return
    setPlayingVideo({
      bvid,
      video: videoInfo as any, // what the fuck!!!
      page: currentPage,
    })
  }, [videoInfo, bvid, currentPage])
  if (!videoInfo.aid || typeof videoInfo.name !== 'string') {
    return null
  }
  return (
    <View style={commonStyles.flex1}>
      <Player />
      <ScrollView style={styles.videoInfoContainer}>
        <VideoInfo changePage={setCurrentPage} />
        <View style={{ marginTop: 10 }}>
          <CommentList
            upName={videoInfo.name}
            commentId={videoInfo.aid}
            commentType={1}
            dividerRight={
              <View style={styles.right}>
                <Pressable
                  onPress={() => {
                    videoInfo.bvid &&
                      Clipboard.setStringAsync(videoInfo.bvid).then(() => {
                        showToast('已复制视频ID')
                      })
                  }}>
                  <Text
                    style={[
                      commonStyles.font12,
                      { color: theme.colors.grey1 },
                    ]}>
                    {videoInfo.bvid}
                  </Text>
                </Pressable>
                <Text
                  style={[
                    commonStyles.font12,
                    commonStyles.bold,
                    { color: theme.colors.grey1 },
                  ]}>
                  {' · '}
                </Text>
                <Text
                  style={[commonStyles.font12, { color: theme.colors.grey1 }]}>
                  {videoInfo?.tname}
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
