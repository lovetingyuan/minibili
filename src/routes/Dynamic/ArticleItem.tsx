import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import { useRoute } from '@react-navigation/native'

export default function ArticleItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_ARTICLE>,
) {
  const route = useRoute()
  const isDetail = route.name === 'DynamicDetail'
  const lines = isDetail ? undefined : 5
  return (
    <View>
      <Text
        style={[
          styles.title,
          isDetail && {
            fontSize: 18,
          },
        ]}>
        {isDetail ? '' : '文章：'}
        {props.payload.title}
      </Text>
      {/* <Pressable
        onPress={() => {
          Linking.openURL(props.payload.url)
        }}> */}
      <Text
        style={[
          styles.article,
          isDetail && {
            lineHeight: 26,
            fontSize: 16,
          },
        ]}
        numberOfLines={lines}>
        {props.payload.text}
      </Text>
      {/* </Pressable> */}
    </View>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: 'bold', padding: 8 },
  article: {
    // borderWidth: 0.5,
    padding: 8,
    borderRadius: 4,
    // borderColor: '#aaa',
  },
})
