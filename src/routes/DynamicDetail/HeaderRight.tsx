import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Image, Pressable, StyleSheet } from 'react-native'
import { NavigationProps, RootStackParamList } from '../../types'
import React from 'react'
import { useNavigation } from '@react-navigation/native'

export default function HeaderRight(
  props: NativeStackScreenProps<RootStackParamList, 'DynamicDetail'>,
) {
  const { id, name } = props.route.params.detail
  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <Pressable
      style={{ padding: 8 }}
      onPress={() => {
        navigation.navigate('WebPage', {
          title: name + '的动态',
          url: `https://m.bilibili.com/dynamic/${id}`,
        })
      }}>
      <Image style={styles.image} source={require('../../../assets/to.png')} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  image: { width: 32, height: 20 },
})
