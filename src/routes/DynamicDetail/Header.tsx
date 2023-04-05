import { Avatar, Icon } from '@rneui/base'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { handleShareVideo, parseNumber } from '../../utils'
import React from 'react'

export default function Header(props: {
  face: string
  name: string
  id: string
  text: string
  likeCount: number
  forwardCount: number
  date: string
}) {
  const { face, name, id, date, text, likeCount, forwardCount } = props
  return (
    <View style={styles.header}>
      <View style={styles.upInfoContainer}>
        <Avatar size={30} rounded source={{ uri: face + '@80w_80h_1c.webp' }} />
        <Text style={[styles.upName]}>{name}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.iconText}>
          <Icon name="date-range" size={15} color="#666" />
          <Text style={styles.text}>{date}</Text>
        </View>
        <View style={styles.iconText}>
          <Icon name="thumb-up-off-alt" size={15} color="#666" />
          <Text style={styles.text}>{parseNumber(likeCount)}</Text>
        </View>
        <Pressable
          style={styles.share}
          onPress={() => {
            handleShareVideo(name, text.substring(0, 30), id)
          }}>
          <Text style={styles.text}>
            {parseNumber(forwardCount)}
            {'  '}
          </Text>
          <Icon type="fontisto" name="share-a" size={13} color="#666" />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    marginTop: 20,
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
  info: {
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
  text: {
    color: '#666',
    fontSize: 12,
  },
  share: { flexDirection: 'row', alignItems: 'center' },
})
