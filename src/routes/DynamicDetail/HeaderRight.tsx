import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Image, Linking, Pressable, StyleSheet } from 'react-native'
import { RootStackParamList } from '../../types'
import React from 'react'

export default function HeaderRight(
  props: NativeStackScreenProps<RootStackParamList, 'DynamicDetail'>,
) {
  const { id } = props.route.params.detail
  return (
    <Pressable
      onPress={() => {
        Linking.openURL(`https://m.bilibili.com/dynamic/${id}`)
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
