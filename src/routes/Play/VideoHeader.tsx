import { useNavigation } from '@react-navigation/native'
import { Avatar, Icon, Text } from '@rneui/themed'
import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { useVideoInfo } from '../../api/video-info'
import { NavigationProps } from '../../types'
import {
  handleShareVideo,
  imgUrl,
  parseDate,
  parseNumber,
  showToast,
} from '../../utils'
// import VideoInfoContext from './videoContext'
import { Image } from 'expo-image'
import { useStore } from '../../store'

export default React.memo(function VideoHeader() {
  // const { video, bvid } = React.useContext(VideoInfoContext)
  const { playingVideo } = useStore()
  const { video, bvid } = playingVideo || {}
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { data: video2 } = useVideoInfo(bvid)
  const videoInfo = {
    ...video,
    ...video2,
  }
  const { name, face, mid, pubDate, pubTime, title } = videoInfo
  // const routes = useNavigationState(state => state.routes)
  return (
    <View style={styles.videoHeader}>
      <Pressable
        onPress={() => {
          if (!mid || !face || !name) {
            return
          }
          const user = {
            mid,
            face,
            name,
            sign: '-',
          }
          navigation.push('Dynamic', { user })
        }}
        style={styles.upInfoContainer}>
        {face ? (
          <Avatar
            size={32}
            rounded
            source={{ uri: imgUrl(face, 80) }}
            ImageComponent={Image}
          />
        ) : null}
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.upName}>
          {name + ' '}
        </Text>
      </Pressable>
      <View style={styles.VideoItem}>
        <View style={styles.iconText}>
          <Icon name="date-range" size={15} />
          <Text style={styles.VideoItemText}>
            {parseDate(pubDate || pubTime)}
          </Text>
        </View>
        <View style={styles.iconText}>
          <Icon name="play-circle-outline" size={15} />
          <Text style={styles.VideoItemText}>
            {parseNumber(videoInfo?.viewNum)}
          </Text>
        </View>
        <Pressable
          style={styles.iconText}
          onPress={() => {
            showToast('不支持点赞')
          }}>
          <Icon name="thumb-up-off-alt" size={15} />
          <Text style={styles.VideoItemText}>
            {parseNumber(videoInfo?.likeNum)}
          </Text>
        </Pressable>

        <Pressable
          style={styles.shareBtn}
          onPress={() => {
            if (name && title && bvid) {
              handleShareVideo(name, title, bvid)
            }
          }}>
          <Icon type="material-community" name="share" size={20} />
          <Text style={[styles.VideoItemText]}>
            {parseNumber(videoInfo?.shareNum)}
          </Text>
        </Pressable>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  upInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 5,
    flex: 1,
  },
  upName: {
    marginLeft: 10,
    marginRight: 5,
    fontSize: 17,
    fontWeight: 'bold',
    flexGrow: 1,
    flexShrink: 1,
  },
  VideoItem: {
    flexDirection: 'row',
    flexShrink: 0,
    color: '#666',
    alignItems: 'center',
    gap: 10,
  },
  iconText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  VideoItemText: {
    fontSize: 13,
  },
  shareBtn: { flexDirection: 'row', alignItems: 'center' },
})
