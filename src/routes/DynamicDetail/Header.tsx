import { View } from 'react-native'
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
      className="p-1"
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

function HeaderTitle() {
  const route = useRoute<RouteProp<RootStackParamList, 'DynamicDetail'>>()
  const { face, name } = route.params.detail
  return (
    <View className="flex-row items-center gap-3 relative left-[-20px]">
      <Avatar
        size={33}
        rounded
        source={{ uri: imgUrl(face, 80) }}
        ImageComponent={Image}
      />
      <Text className="ml-1 text-lg">{name}的动态</Text>
    </View>
  )
}

export const dynamicDetailHeaderRight = () => <HeaderRight />
export const dynamicDetailHeaderTitle = () => <HeaderTitle />
