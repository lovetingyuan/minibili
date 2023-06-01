import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet } from 'react-native'
import { NavigationProps, RootStackParamList } from '../../types'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { Icon } from '@rneui/themed'

export default function HeaderRight(
  props: NativeStackScreenProps<RootStackParamList, 'DynamicDetail'>,
) {
  const { id, name } = props.route.params.detail
  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <Icon
      name="open-in-new"
      color="#F85A54"
      style={styles.container}
      size={20}
      onPress={() => {
        navigation.navigate('WebPage', {
          title: name + '的动态',
          url: `https://m.bilibili.com/dynamic/${id}`,
        })
      }}
    />
  )
}

const styles = StyleSheet.create({
  container: { padding: 5 },
})
