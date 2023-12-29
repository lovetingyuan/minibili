import { StyleSheet, View } from 'react-native'
import { NavigationProps, RootStackParamList } from '../../types'
import React from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Icon, Avatar, Text } from '@rneui/themed'
import { imgUrl } from '../../utils'
import { Image } from 'expo-image'

function HeaderRight() {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const route = useRoute<RouteProp<RootStackParamList, 'DynamicDetail'>>()
  const { id, name } = route.params.detail
  return (
    <Icon
      name="open-in-new"
      color="#F85A54"
      style={styles.icon}
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

export function HeaderTitle() {
  const route = useRoute<RouteProp<RootStackParamList, 'DynamicDetail'>>()
  const { face, name } = route.params.detail
  return (
    <View style={styles.container}>
      <Avatar
        size={33}
        rounded
        source={{ uri: imgUrl(face, 80) }}
        ImageComponent={Image}
      />
      <Text style={styles.text}>{name}的动态</Text>
    </View>
  )
}

export const dynamicDetailHeaderRight = () => <HeaderRight />
export const dynamicDetailHeaderTitle = () => <HeaderTitle />

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
    left: -20,
  },
  text: { fontSize: 18, marginLeft: 5 },
  icon: {
    padding: 5,
  },
})
