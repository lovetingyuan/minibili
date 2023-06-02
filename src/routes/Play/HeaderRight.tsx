import { StyleSheet } from 'react-native'
import React from 'react'
import { openBiliVideo } from '../../utils'
import { Icon } from '@rneui/themed'
import VideoInfoContext from './videoContext'

export default function HeaderRight() {
  const { bvid } = React.useContext(VideoInfoContext)
  return (
    <Icon
      name="open-in-new"
      color="#F85A54"
      style={styles.container}
      size={20}
      onPress={() => {
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
