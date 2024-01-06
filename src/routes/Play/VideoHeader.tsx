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
import { Image } from 'expo-image'

export default React.memo(function VideoHeader(props: { bvid: string }) {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { data: videoInfo } = useVideoInfo(props.bvid)

  const { name, face, mid, date, title } = videoInfo || {}
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
          <Text style={styles.VideoItemText}>{parseDate(date)}</Text>
        </View>
        <View style={styles.iconText}>
          <Icon name="play-circle-outline" size={15} />
          <Text style={styles.VideoItemText}>
            {parseNumber(videoInfo?.playNum)}
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
            if (name && title && props.bvid) {
              handleShareVideo(name, title, props.bvid)
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
