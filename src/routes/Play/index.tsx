import React from 'react'
import { StyleSheet, View, ScrollView, Pressable } from 'react-native'
import { Text, useTheme } from '@rneui/themed'
import * as KeepAwake from 'expo-keep-awake'
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
import { checkWifi, showToast } from '../../utils'
import useMounted from '../../hooks/useMounted'
import VideoInfoContext from './videoContext'
import HeaderRight from './HeaderRight'
import { useFocusEffect } from '@react-navigation/native'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import { setViewingVideoId } from '../../utils/report'
// import { useStore } from '../../store'

type Props = NativeStackScreenProps<RootStackParamList, 'Play'>

const PlayPage = ({ route, navigation }: Props) => {
  const { video, bvid } = route.params
  const [currentPage, setCurrentPage] = React.useState(1)
  const { data: video2 } = useVideoInfo(bvid)
  const { theme } = useTheme()
  const videoInfo = {
    ...video,
    ...video2,
    bvid,
  }
  React.useEffect(() => {
    videoInfo.name &&
      navigation.setOptions({
        headerTitle: videoInfo.name,
        headerRight: () => <HeaderRight bvid={bvid} />,
      })
  }, [navigation, videoInfo.name, bvid])
  useMounted(() => {
    checkWifi()
    return () => {
      KeepAwake.deactivateKeepAwake('PLAY')
    }
  })
  useFocusEffect(
    useMemoizedFn(() => {
      setViewingVideoId(bvid)
      return () => {
        setViewingVideoId(null)
      }
    }),
  )
  if (!videoInfo.name) {
    return null
  }
  if (!videoInfo.aid) {
    return null
  }
  // if (
  //   typeof videoInfo.aid !== 'string' ||
  //   typeof videoInfo.name !== 'string' ||
  //   typeof videoInfo.bvid !== 'string'
  // ) {
  //   return null
  // }
  if (typeof videoInfo.name !== 'string') {
    return null
  }
  return (
    <VideoInfoContext.Provider
      value={{
        bvid,
        video: videoInfo as any, // what the fuck!!!
        page: currentPage,
      }}>
      <View style={styles.container}>
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
                    <Text style={[styles.text, { color: theme.colors.grey1 }]}>
                      {videoInfo.bvid}
                    </Text>
                  </Pressable>
                  <Text
                    style={[
                      styles.text,
                      { color: theme.colors.grey1, fontWeight: 'bold' },
                    ]}>
                    {' · '}
                  </Text>
                  <Text style={[styles.text, { color: theme.colors.grey1 }]}>
                    {videoInfo?.tname}
                  </Text>
                </View>
              }
            />
          </View>
        </ScrollView>
      </View>
    </VideoInfoContext.Provider>
  )
}

export default PlayPage

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoInfoContainer: { paddingVertical: 18, paddingHorizontal: 12 },
  text: { fontSize: 12 },
  right: { flexDirection: 'row', alignItems: 'center' },
})
