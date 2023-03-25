import React from 'react'
import {
  StyleSheet,
  View,
  ToastAndroid,
  Text,
  ScrollView,
  Pressable,
  Image,
} from 'react-native'
import { getVideoComments, getVideoInfo } from '../../services/Bilibili'
import { Avatar, ButtonGroup } from '@rneui/base'
// import useNetStatusToast from '../../hooks/useNetStatusToast';
import * as KeepAwake from 'expo-keep-awake'
import Comment from '../../components/Comment'
import * as Clipboard from 'expo-clipboard'
// https://www.bilibili.com/blackboard/newplayer.html?crossDomain=true&bvid=BV1cB4y1n7v8&as_wide=1&page=1&autoplay=0&poster=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?danmaku=1&highQuality=0&bvid=BV1cB4y1n7v8
// https://player.bilibili.com/player.html?aid=899458592&bvid=BV1BN4y1G7tx&cid=802365081&page=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=BV1BN4y1G7tx&page=1&posterFirst=1

// import NetInfo from '@react-native-community/netinfo'

import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { GetFuncPromiseType, RootStackParamList } from '../../types'
// import { useFocusEffect, useIsFocused } from '@react-navigation/native'
import store from '../../store'
// import { useSnapshot } from 'valtio'

// import { debounce } from 'throttle-debounce'
import { PlayInfo } from '../../components/PlayInfo'
import { useIsWifi } from '../../hooks/useIsWifi'
import Player from './Player'
import { openBiliVideo } from '../../utils'
type Props = NativeStackScreenProps<RootStackParamList, 'Play'>

export default ({ route, navigation }: Props) => {
  __DEV__ && console.log(route.name)
  const { aid, bvid, name, mid } = route.params
  type Comments = GetFuncPromiseType<typeof getVideoComments>
  type VideoInfo = GetFuncPromiseType<typeof getVideoInfo>
  const [comments, setComments] = React.useState<Comments>([])
  const [videoInfo, setVideoInfo] = React.useState<VideoInfo | null>(null)
  const [currentPage, setCurrentPage] = React.useState(0)

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => {
            openBiliVideo(bvid)
          }}>
          <Image
            style={{ width: 36, height: 14 }}
            source={require('../../assets/bili-text.png')}
          />
        </Pressable>
      ),
    })
  }, [navigation, bvid])

  // const { specialUser } = useSnapshot(store)
  // const tracyStyle =
  //   mid == specialUser?.mid
  //     ? {
  //         color: 'rgb(251, 114, 153)',
  //       }
  //     : null
  React.useEffect(() => {
    getVideoComments(aid).then(replies => {
      setComments(replies)
    })
    getVideoInfo(aid).then(vi => {
      setVideoInfo(vi)
    })
  }, [bvid, aid])
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

  let videoDesc = videoInfo?.desc
  if (videoDesc === '-') {
    videoDesc = ''
  } else if (
    videoDesc &&
    videoInfo?.videosNum === 1 &&
    videoDesc === videoInfo.title
  ) {
    videoDesc = ''
  }
  return (
    <View style={{ flex: 1 }}>
      <Player video={videoInfo} page={currentPage} />
      <ScrollView style={styles.videoInfoContainer}>
        <View style={styles.videoHeader}>
          <Pressable
            onPress={() => {
              store.dynamicUser = {
                mid,
                face: videoInfo?.upFace || '',
                name,
                sign: '-',
              }
              navigation.navigate('Dynamic')
            }}>
            <View style={styles.upInfoContainer}>
              {videoInfo?.upFace ? (
                <Avatar
                  size={35}
                  rounded
                  source={{ uri: videoInfo.upFace + '@80w_80h_1c.webp' }}
                />
              ) : null}
              <Text style={[styles.upName]}>{videoInfo?.upName || '-'}</Text>
            </View>
          </Pressable>
          {!!videoInfo && <PlayInfo video={videoInfo} name={name} />}
        </View>
        <View>
          <Text style={styles.videoTitle}>
            {videoInfo?.title || videoInfo?.pages[0].title || '-'}
          </Text>
          {videoDesc ? <Text style={styles.videoDesc}>{videoDesc}</Text> : null}
          {
            (videoInfo?.videosNum || 0) > 1 ? (
              <ButtonGroup
                buttonStyle={{}}
                buttonContainerStyle={{
                  margin: 0,
                }}
                innerBorderStyle={{
                  width: 0.5,
                }}
                buttons={videoInfo?.pages.map((v, i) => `${i + 1}. ${v.title}`)}
                containerStyle={{
                  marginTop: 16,
                  marginLeft: 0,
                  marginRight: 0,
                  borderWidth: 0,
                }}
                onPress={setCurrentPage}
                selectedButtonStyle={{}}
                selectedIndex={currentPage}
                selectedTextStyle={{}}
                textStyle={{
                  fontSize: 14,
                }}
              />
            ) : videoInfo?.videos !== videoInfo?.videosNum ? (
              <Text>该视频为交互视频，暂不支持</Text>
            ) : null // <ScrollView
            //   horizontal
            //   showsHorizontalScrollIndicator
            //   style={styles.videoPages}>
            //   <ButtonGroup
            //     buttonStyle={{ width: 100 }}
            //     buttonContainerStyle={
            //       {
            //         // marginTop: 15,
            //       }
            //     }
            //     buttons={videoInfo?.pages.map(v => v.title)}
            //     containerStyle={{
            //       marginTop: 15,
            //       marginLeft: 0,
            //       marginRight: 0,
            //     }}
            //     innerBorderStyle={{}}
            //     onPress={i => setCurrentPage(i)}
            //     selectedButtonStyle={{
            //       borderWidth: 1,
            //       borderColor: 'blue',
            //     }}
            //     selectedIndex={currentPage}
            //     // selectedIndexes={selectedIndexes}
            //     selectedTextStyle={{}}
            //     textStyle={{
            //       fontSize: 14,
            //     }}
            //   />
            //   {/* {videoInfo?.pages.map((item, i) => {
            //     return (
            //       <Button
            //         key={item.cid}
            //         type="clear"
            //         onPress={() => {
            //           setCurrentPage(i);
            //         }}>
            //         {item.title}
            //       </Button>
            //     );
            //   })} */}
            // </ScrollView>
          }
        </View>
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Pressable
            onPress={() => {
              Clipboard.setStringAsync(videoInfo?.bvid || '').then(() => {
                ToastAndroid.show('已复制', ToastAndroid.SHORT)
              })
            }}>
            <Text style={{ color: '#666', fontSize: 12 }}>
              {'  '}
              {videoInfo?.bvid}
              {' - '}
            </Text>
          </Pressable>
          <Text style={{ color: '#666', fontSize: 12 }}>
            {videoInfo?.tname}
          </Text>
        </View>
        {comments?.length ? (
          comments.map((comment, i) => {
            return (
              <View
                key={comment.id}
                style={[
                  styles.commentItemContainer,
                  i ? null : { marginTop: 0 },
                ]}>
                <Comment upName={name} comment={comment} />
              </View>
            )
          })
        ) : (
          <View>
            <Text style={styles.noCommentText}>暂无评论</Text>
          </View>
        )}
        {comments.length ? (
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>只加载前40条</Text>
            <Text />
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoInfoContainer: { paddingVertical: 18, paddingHorizontal: 12 },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  upInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  upName: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoTitle: { fontSize: 16, marginTop: 12 },
  videoDesc: { marginTop: 10 },
  videoPages: {
    // flex: 1,
  },
  divider: {
    flexDirection: 'row',
    marginVertical: 18,
    alignItems: 'center',
  },
  dividerLine: {
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    flexGrow: 1,
  },
  commentItemContainer: {
    marginTop: 20,
    borderBottomColor: '#eee',
    borderBottomWidth: 0.5,
  },
  footerContainer: { marginVertical: 10, alignItems: 'center' },
  footerText: { color: '#aaa', fontSize: 12 },
  noCommentText: {
    textAlign: 'center',
    marginVertical: 50,
  },
})
