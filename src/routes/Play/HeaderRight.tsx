import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Image, Pressable, StyleSheet } from 'react-native'
import { RootStackParamList } from '../../types'
import React from 'react'
import { openBiliVideo } from '../../utils'

export default function HeaderRight(
  props: NativeStackScreenProps<RootStackParamList, 'Play'>,
) {
  return (
    <Pressable
      onPress={() => {
        openBiliVideo(props.route.params.bvid)
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
