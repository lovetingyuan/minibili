import { Icon, Text, useTheme } from '@rneui/themed'
import React from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
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
  const { theme } = useTheme()
  const gray = theme.colors.grey1
  const textStyle = {
    color: gray,
    fontSize: 13,
  }
  return (
    <View style={styles.VideoItem}>
      <View style={styles.iconText}>
        <Icon name="date-range" size={15} color={gray} />
        <Text style={textStyle}>{props.date}</Text>
      </View>
      <View style={styles.iconText}>
        <Icon name="thumb-up-off-alt" size={15} color={gray} />
        <Text style={textStyle}>{parseNumber(props.like)}</Text>
      </View>
      <Pressable
        style={styles.shareBtn}
        onPress={() => {
          handleShareVideo(props.name, props.title, props.id)
        }}>
        <Icon type="material-community" name="share" size={20} color={gray} />
        {props.share ? (
          <Text style={textStyle}>{parseNumber(props.share)}</Text>
        ) : null}
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
    gap: 20,
    marginTop: 5,
  },
  iconText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  VideoItemText: {
    fontSize: 12,
  },
  shareBtn: { flexDirection: 'row', alignItems: 'center' },
})
