import React from 'react'
import { StyleSheet, View, Text, Pressable } from 'react-native'
import { handleShareVideo, parseDate, parseNumber } from '../utils'
import { Icon } from '@rneui/base'
import { VideoInfo } from '../api/video-info'

export function PlayInfo(props: { name: string; video: VideoInfo }) {
  if (!props.video.bvid) {
    return null
  }
  return (
    <View style={styles.VideoItem}>
      <View style={styles.iconText}>
        <Icon name="date-range" size={15} color="#666" />
        <Text style={styles.VideoItemText}>
          {parseDate(props.video.pubTime)}
        </Text>
      </View>
      <View style={styles.iconText}>
        <Icon name="play-circle-outline" size={15} color="#666" />
        <Text style={styles.VideoItemText}>
          {parseNumber(props.video.viewNum)}
        </Text>
      </View>
      <View style={styles.iconText}>
        <Icon name="thumb-up-off-alt" size={15} color="#666" />
        <Text style={styles.VideoItemText}>
          {parseNumber(props.video.likeNum)}
        </Text>
      </View>
      {!!props.video.bvid && (
        <Pressable
          onPress={() => {
            handleShareVideo(props.name, props.video.title, props.video.bvid)
          }}>
          <Icon type="fontisto" name="share-a" size={13} color="#666" />
        </Pressable>
      )}
    </View>
  )
}
export function SimpleVideoInfo(props: {
  name: string
  bvid: string | number
  title: string
  date: string
  play?: string
}) {
  return (
    <View style={styles.VideoItem}>
      <View style={styles.iconText}>
        <Icon name="date-range" size={15} color="#666" />
        <Text style={styles.VideoItemText}>{props.date}</Text>
      </View>
      {props.play === undefined ? null : (
        <View style={styles.iconText}>
          <Icon name="play-circle-outline" size={15} color="#666" />
          <Text style={styles.VideoItemText}>{props.play}</Text>
        </View>
      )}
      <Pressable
        onPress={() => {
          handleShareVideo(props.name, props.title, props.bvid)
        }}>
        <Icon type="fontisto" name="share-a" size={13} color="#666" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
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
