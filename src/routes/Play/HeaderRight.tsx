import { StyleSheet } from 'react-native'
import React from 'react'
import { openBiliVideo } from '../../utils'
import store from '../../store'
import { Icon } from '@rneui/themed'

export default function HeaderRight() {
  return (
    <Icon
      name="open-in-new"
      color="#F85A54"
      style={styles.container}
      size={20}
      onPress={() => {
        const bvid = store.currentVideo?.bvid
        if (bvid) {
          openBiliVideo(bvid)
        }
      }}
    />
  )
}
const styles = StyleSheet.create({
  container: { padding: 5 },
})
