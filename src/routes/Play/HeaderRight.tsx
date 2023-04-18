import { Image, Pressable, StyleSheet } from 'react-native'
import React from 'react'
import { openBiliVideo } from '../../utils'
import store from '../../store'

export default function HeaderRight() {
  return (
    <Pressable
      style={{ padding: 8 }}
      onPress={() => {
        const bvid = store.currentVideo?.bvid
        if (bvid) {
          openBiliVideo(bvid)
        }
      }}>
      <Image style={styles.image} source={require('../../../assets/to.png')} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  image: { width: 32, height: 20 },
})
