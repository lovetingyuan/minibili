import { StyleSheet } from 'react-native'
import React from 'react'
import { openBiliVideo } from '../../utils'
import { Icon } from '@rneui/themed'

export default function HeaderRight(props: { bvid: string }) {
  return (
    <Icon
      name="open-in-new"
      color="#F85A54"
      style={styles.container}
      size={20}
      onPress={() => {
        openBiliVideo(props.bvid)
      }}
    />
  )
}
const styles = StyleSheet.create({
  container: { padding: 5 },
})
