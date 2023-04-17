import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Image, Pressable, StyleSheet } from 'react-native'
import { NavigationProps, RootStackParamList } from '../../types'
import React from 'react'
import { useNavigation } from '@react-navigation/native'

export default function HeaderRight(
  props: NativeStackScreenProps<RootStackParamList, 'DynamicDetail'>,
) {
  const { id } = props.route.params.detail
  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <Pressable
      onPress={() => {
        console.log(`https://m.bilibili.com/dynamic/${id}`)
        navigation.navigate('WebPage', {
          url: `https://m.bilibili.com/dynamic/${id}`,
        })
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
