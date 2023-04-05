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

// https://www.bilibili.com/blackboard/newplayer.html?crossDomain=true&bvid=BV1cB4y1n7v8&as_wide=1&page=1&autoplay=0&poster=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?danmaku=1&highQuality=0&bvid=BV1cB4y1n7v8
// https://player.bilibili.com/player.html?aid=899458592&bvid=BV1BN4y1G7tx&cid=802365081&page=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=BV1BN4y1G7tx&page=1&posterFirst=1

import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../types'
import Player from './VideoPlayer'
import { useVideoInfo, VideoInfo as VideoInfoType } from '../../api/video-info'
import CommentList from '../../components/CommentList'
import VideoInfo from './VideoInfo'

type Props = NativeStackScreenProps<RootStackParamList, 'Play'>

const PlayPage = ({ route }: Props) => {
  __DEV__ && console.log(route.name)
  const {
    commentId,
    bvid,
    name,
    wifi,
    title,
    desc,
    face,
    cover,
    mid,
    date,
    from,
  } = route.params
  const [videoInfo, setVideoInfo] = React.useState<VideoInfoType | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const { data: vi, error } = useVideoInfo(bvid)
  if (!error && vi?.bvid && !videoInfo?.bvid) {
    setVideoInfo(vi)
  }
  const isFromDynamic = from === 'dynamic'
  React.useEffect(() => {
    if (!wifi) {
      ToastAndroid.showWithGravity(
        ' 请注意当前网络不是 Wifi ',
        ToastAndroid.LONG,
        ToastAndroid.CENTER,
      )
    }
    return () => {
      KeepAwake.deactivateKeepAwake('PLAY')
    }
  }, [wifi])
  return (
    <View style={styles.container}>
      <Player cover={cover} page={currentPage} bvid={bvid} />
      <ScrollView style={styles.videoInfoContainer}>
        <VideoInfo
          bvid={bvid}
          title={title}
          desc={desc}
          face={face}
          name={name}
          mid={mid}
          date={date}
          page={currentPage}
          changePage={setCurrentPage}
          isFromDynamic={isFromDynamic}
        />
        <View style={{ marginTop: 10 }}>
          <CommentList
            upName={name}
            commentId={commentId}
            commentType={1}
            dividerRight={
              <View style={styles.right}>
                <Pressable
                  onPress={() => {
                    Clipboard.setStringAsync(bvid).then(() => {
                      ToastAndroid.show('已复制', ToastAndroid.SHORT)
                    })
                  }}>
                  <Text style={styles.text}>{bvid}</Text>
                </Pressable>
                <Text> - </Text>
                <Text style={styles.text}>{videoInfo?.tname}</Text>
              </View>
            }
          />
        </View>
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
  text: { color: '#666', fontSize: 12 },
  right: { flexDirection: 'row', alignItems: 'center' },
})
