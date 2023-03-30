import React from 'react'
import {
  StyleSheet,
  View,
  ToastAndroid,
  // Text,
  ScrollView,
  Pressable,
  Image,
} from 'react-native'
// import { Avatar, Icon, ListItem } from '@rneui/base'
import * as KeepAwake from 'expo-keep-awake'
// import * as Clipboard from 'expo-clipboard'
// https://www.bilibili.com/blackboard/newplayer.html?crossDomain=true&bvid=BV1cB4y1n7v8&as_wide=1&page=1&autoplay=0&poster=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?danmaku=1&highQuality=0&bvid=BV1cB4y1n7v8
// https://player.bilibili.com/player.html?aid=899458592&bvid=BV1BN4y1G7tx&cid=802365081&page=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=BV1BN4y1G7tx&page=1&posterFirst=1

import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../types'
// import store from '../../store'
// import { PlayInfo } from '../../components/PlayInfo'
import { useIsWifi } from '../../hooks/useIsWifi'
import Player from './VideoPlayer'
import { openBiliVideo } from '../../utils'
import { useVideoInfo, VideoInfo as VideoInfoType } from '../../api/video-info'
import CommentList from './CommentList'
import VideoInfo from './VideoInfo'

type Props = NativeStackScreenProps<RootStackParamList, 'Play'>

const PlayPage = ({ route, navigation }: Props) => {
  __DEV__ && console.log(route.name)
  const { commentId, bvid, name } = route.params
  const [videoInfo, setVideoInfo] = React.useState<VideoInfoType | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => {
            openBiliVideo(bvid)
          }}>
          <Image
            style={{ width: 36, height: 14 }}
            source={require('../../../assets/bili-text.png')}
          />
        </Pressable>
      ),
    })
  }, [navigation, bvid])

  const { data: vi, error } = useVideoInfo(bvid)
  if (!error && vi?.bvid && !videoInfo?.bvid) {
    setVideoInfo(vi)
  }
  const isWifi = useIsWifi()
  React.useEffect(() => {
    if (isWifi === false) {
      ToastAndroid.showWithGravity(
        ' 请注意当前网络不是 Wifi ',
        ToastAndroid.LONG,
        ToastAndroid.CENTER,
      )
    }
  }, [isWifi])
  React.useEffect(() => {
    return () => {
      KeepAwake.deactivateKeepAwake('PLAY')
    }
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <Player video={videoInfo} page={currentPage} />
      <ScrollView style={styles.videoInfoContainer}>
        <VideoInfo
          videoInfo={videoInfo}
          currentPage={currentPage}
          changeCurrentPage={setCurrentPage}
        />
        <CommentList upName={name} commentId={commentId} />
      </ScrollView>
    </View>
  )
}

export default (props: Props) => {
  return <PlayPage {...props} key={props.route.params.bvid} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoInfoContainer: { paddingVertical: 18, paddingHorizontal: 12 },
})
