import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'

export default function ArticleItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_ARTICLE>,
) {
  // const route = useRoute()
  // const isDetail = route.name === 'DynamicDetail'
  // const lines = isDetail ? undefined : 5
  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        navigation?.navigate('WebPage', {
          url: 'https://www.bilibili.com/read/mobile?id=' + props.commentId,
          title: props.name + '的文章',
        })
      }}>
      <Text style={[styles.title]}>{props.payload.title}</Text>
      <Text style={[styles.article]} numberOfLines={4}>
        {props.payload.text}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: 'bold' },
  article: {
    paddingVertical: 10,
    // borderWidth: 0.5,
    // padding: 8,
    // borderRadius: 4,
    // borderColor: '#aaa',
  },
})
