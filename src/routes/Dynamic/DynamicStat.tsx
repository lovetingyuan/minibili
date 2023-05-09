import { Icon } from '@rneui/themed'
import React from 'react'
import { StyleSheet, View, Pressable, Text } from 'react-native'
import { handleShareVideo, parseNumber } from '../../utils'

export default function DynamicStat(props: {
  id: string | number
  name: string
  date: string
  top?: boolean
  like: number
  share: number
  title: string
}) {
  return (
    <View style={styles.VideoItem}>
      <View style={styles.iconText}>
        <Icon name="date-range" size={15} color="#666" />
        <Text style={styles.VideoItemText}>{props.date}</Text>
      </View>
      <View style={styles.iconText}>
        <Icon name="thumb-up-off-alt" size={15} color="#666" />
        <Text style={styles.VideoItemText}>{parseNumber(props.like)}</Text>
      </View>
      <Pressable
        style={styles.shareBtn}
        onPress={() => {
          handleShareVideo(props.name, props.title, props.id)
        }}>
        <Icon type="material-community" name="share" size={22} color="#666" />
        {props.share ? (
          <Text style={styles.VideoItemText}>{parseNumber(props.share)}</Text>
        ) : null}
      </Pressable>
      {/* {__DEV__ ? (
        <Pressable
          onPress={() => {
            // @ts-ignore
            const item = globalThis._dynamicList.find(v => v.id == props.id)
            console.log('item', JSON.stringify(item, null, 2))
          }}>
          <Text>dev</Text>
        </Pressable>
      ) : null} */}
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
    marginTop: 5,
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
  shareBtn: { flexDirection: 'row', alignItems: 'center' },
})
