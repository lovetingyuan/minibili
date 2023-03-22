import React from 'react'
import { StyleSheet, View, Text, Pressable } from 'react-native'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { parseDate, parseNumber } from '../utils'
import { handleShareVideo } from '../services/Share'
import { GetFuncPromiseType } from '../types'
import { getVideoInfo } from '../services/Bilibili'
type VideoInfo = GetFuncPromiseType<typeof getVideoInfo>

export function PlayInfo(props: { name: string; video: VideoInfo }) {
  if (!props.video.bvid) {
    return null
  }
  return (
    <View style={styles.videoInfo}>
      <View style={styles.iconText}>
        <MaterialIcons name="date-range" size={14} color="#666" />
        <Text style={styles.videoInfoText}>
          {parseDate(props.video.pubTime)}
        </Text>
      </View>
      <View style={styles.iconText}>
        <MaterialIcons name="play-circle-outline" size={14} color="#666" />
        <Text style={styles.videoInfoText}>
          {parseNumber(props.video.viewNum)}
        </Text>
      </View>
      <View style={styles.iconText}>
        <MaterialIcons name="thumb-up-off-alt" size={14} color="#666" />
        <Text style={styles.videoInfoText}>
          {parseNumber(props.video.likeNum)}
        </Text>
      </View>
      {!!props.video.bvid && (
        <Pressable
          onPress={() => {
            handleShareVideo(props.name, props.video.title, props.video.bvid)
          }}>
          <MaterialCommunityIcons name="share" size={18} color="#666" />
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
    <View style={styles.videoInfo}>
      <View style={styles.iconText}>
        <MaterialIcons name="date-range" size={14} color="#666" />
        <Text style={styles.videoInfoText}>{props.date}</Text>
      </View>
      {props.play === undefined ? null : (
        <View style={styles.iconText}>
          <MaterialIcons name="play-circle-outline" size={14} color="#666" />
          <Text style={styles.videoInfoText}>{props.play}</Text>
        </View>
      )}
      <Pressable
        onPress={() => {
          handleShareVideo(props.name, props.title, props.bvid)
        }}>
        <MaterialCommunityIcons name="share" size={18} color="#666" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  videoInfo: {
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
  videoInfoText: {
    color: '#666',
    fontSize: 12,
  },
})
