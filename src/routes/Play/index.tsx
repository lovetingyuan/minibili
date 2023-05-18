import React from 'react'
import {
  StyleSheet,
  View,
  ToastAndroid,
  ScrollView,
  Pressable,
  Text,
} from 'react-native'
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
import { checkWifi } from '../../utils'
import useMounted from '../../hooks/useMounted'
import { useStore } from '../../store'

type Props = NativeStackScreenProps<RootStackParamList, 'Play'>

const PlayPage = ({ route, navigation }: Props) => {
  __DEV__ && console.log(route.name)
  const { currentVideo } = useStore()
  const isFromDynamic = route.params?.from === 'dynamic'
  const [currentPage, setCurrentPage] = React.useState(1)
  const { data: vi } = useVideoInfo(currentVideo?.bvid)

  const videoInfo = {
    ...currentVideo,
    ...vi,
  }
  React.useEffect(() => {
    videoInfo.name &&
      navigation.setOptions({
        headerTitle: videoInfo.name,
      })
  }, [navigation, videoInfo.name])
  useMounted(() => {
    checkWifi()
    return () => {
      KeepAwake.deactivateKeepAwake('PLAY')
    }
  })

  if (!videoInfo.aid || !videoInfo.name) {
    return null
  }
  return (
    <View style={styles.container}>
      <Player page={currentPage} />
      <ScrollView style={styles.videoInfoContainer}>
        <VideoInfo
          page={currentPage}
          changePage={setCurrentPage}
          isFromDynamic={isFromDynamic}
        />
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
                        ToastAndroid.show('已复制', ToastAndroid.SHORT)
                      })
                  }}>
                  <Text style={styles.text}>{videoInfo.bvid}</Text>
                </Pressable>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}> · </Text>
                <Text style={styles.text}>{videoInfo?.tname}</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  )
}

export default PlayPage

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoInfoContainer: { paddingVertical: 18, paddingHorizontal: 12 },
  text: { color: '#666', fontSize: 12 },
  right: { flexDirection: 'row', alignItems: 'center' },
})
