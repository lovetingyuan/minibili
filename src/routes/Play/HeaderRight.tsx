import { Image, Pressable, StyleSheet } from 'react-native'
import React from 'react'
import { openBiliVideo } from '../../utils'
import store from '../../store'

export default function HeaderRight() {
  return (
    <Pressable
      onPress={() => {
        const bvid = store.currentVideo?.bvid
        if (bvid) {
          openBiliVideo(bvid)
        }
      }}>
      <Image
        style={styles.image}
        source={require('../../../assets/bili-text.png')}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  image: { width: 36, height: 14 },
})
