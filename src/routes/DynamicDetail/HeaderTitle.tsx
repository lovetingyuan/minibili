import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Avatar } from '@rneui/themed'
import { StyleSheet, Text, View } from 'react-native'
import { RootStackParamList } from '../../types'
import React from 'react'

export default function HeaderTitle(
  props: NativeStackScreenProps<RootStackParamList, 'DynamicDetail'>,
) {
  const { face, name } = props.route.params.detail
  return (
    <View style={styles.container}>
      <Avatar size={30} rounded source={{ uri: face + '@80w_80h_1c.webp' }} />
      <Text style={styles.text}>{name}的动态</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
    left: -20,
  },
  text: { fontSize: 18 },
})
