import { useNavigation } from '@react-navigation/native'
import { Avatar, Icon } from '@rneui/base'
import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useVideoInfo } from '../../api/video-info'
import store from '../../store'
import { NavigationProps } from '../../types'
import { handleShareVideo, parseNumber } from '../../utils'

export default function VideoHeader(props: {
  bvid: string
  name: string
  face: string
  mid: number | string
  date: string
  title: string
  isFromDynamic: boolean
}) {
  const { bvid, name, face, mid, date, title, isFromDynamic } = props
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { data: videoInfo } = useVideoInfo(bvid)
  return (
    <View style={styles.videoHeader}>
      <Pressable
        onPress={() => {
          if (isFromDynamic) {
            return
          }
          store.dynamicUser = {
            mid,
            face,
            name,
            sign: '-',
          }
          navigation.navigate('Dynamic')
        }}>
        <View style={styles.upInfoContainer}>
          <Avatar
            size={35}
            rounded
            source={{ uri: face + '@80w_80h_1c.webp' }}
          />
          <Text style={[styles.upName]}>{name}</Text>
        </View>
      </Pressable>
      <View style={styles.VideoItem}>
        <View style={styles.iconText}>
          <Icon name="date-range" size={15} color="#666" />
          <Text style={styles.VideoItemText}>{date}</Text>
        </View>
        <View style={styles.iconText}>
          <Icon name="play-circle-outline" size={15} color="#666" />
          <Text style={styles.VideoItemText}>
            {parseNumber(videoInfo?.viewNum)}
          </Text>
        </View>
        <View style={styles.iconText}>
          <Icon name="thumb-up-off-alt" size={15} color="#666" />
          <Text style={styles.VideoItemText}>
            {parseNumber(videoInfo?.likeNum)}
          </Text>
        </View>

        <Pressable
          onPress={() => {
            handleShareVideo(name, title, bvid)
          }}>
          <Icon type="fontisto" name="share-a" size={13} color="#666" />
        </Pressable>
      </View>
    </View>
  )
}

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
    marginRight: 12,
  },
  upName: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  VideoItem: {
    flexDirection: 'row',
    flexShrink: 0,
    minWidth: 80,
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
    color: '#666',
    fontSize: 12,
  },
})
