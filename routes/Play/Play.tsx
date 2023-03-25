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
import { Avatar, Icon, ListItem } from '@rneui/base'
import * as KeepAwake from 'expo-keep-awake'
import Comment from '../../components/Comment'
import * as Clipboard from 'expo-clipboard'
// https://www.bilibili.com/blackboard/newplayer.html?crossDomain=true&bvid=BV1cB4y1n7v8&as_wide=1&page=1&autoplay=0&poster=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?danmaku=1&highQuality=0&bvid=BV1cB4y1n7v8
// https://player.bilibili.com/player.html?aid=899458592&bvid=BV1BN4y1G7tx&cid=802365081&page=1
// https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=BV1BN4y1G7tx&page=1&posterFirst=1

import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { GetFuncPromiseType, RootStackParamList } from '../../types'
import store from '../../store'
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
            source={require('../../assets/bili-text.png')}
          />
        </Pressable>
      ),
    })
  }, [navigation, bvid])

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

  const [expanded, setExpanded] = React.useState(false)

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
          {(videoInfo?.videosNum || 0) > 1 ? (
            <ListItem.Accordion
              containerStyle={{
                paddingVertical: 5,
                paddingHorizontal: 10,
                marginTop: 20,
              }}
              content={
                <ListItem.Content>
                  <ListItem.Title>
                    视频分集（{videoInfo?.videosNum}） {currentPage}:{' '}
                    {videoInfo?.pages[currentPage].title}
                  </ListItem.Title>
                </ListItem.Content>
              }
              isExpanded={expanded}
              onPress={() => {
                setExpanded(!expanded)
              }}>
              {videoInfo?.pages.map(v => {
                const selected = v.page === currentPage
                return (
                  <ListItem
                    key={v.cid}
                    onPress={() => {
                      setCurrentPage(v.page)
                    }}
                    containerStyle={{
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      backgroundColor: selected ? '#00AEEC' : 'white',
                    }}
                    bottomDivider>
                    <ListItem.Content>
                      <ListItem.Title
                        style={{
                          color: selected ? 'white' : '#555',
                        }}>
                        {v.page}. {v.title}
                      </ListItem.Title>
                    </ListItem.Content>
                  </ListItem>
                )
              })}
            </ListItem.Accordion>
          ) : videoInfo?.videos !== videoInfo?.videosNum ? (
            <Text style={{ marginTop: 10, color: 'orange' }}>
              该视频为交互视频，暂不支持
            </Text>
          ) : null}
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
            </Text>
          </Pressable>
          <Icon type="entypo" name="dot-single" size={12} color="#666" />
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
