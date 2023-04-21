import React from 'react'
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import DynamicStat from './DynamicStat'
import { DynamicTypeEnum } from '../../api/dynamic-items.schema'

export default function ArticleItem(
  props: DynamicItemType<DynamicTypeEnum.DYNAMIC_TYPE_ARTICLE>,
) {
  return (
    <View>
      <Text style={styles.title}>{props.payload.title}</Text>
      <Pressable
        onPress={() => {
          Linking.openURL(props.payload.url)
        }}>
        <Text style={styles.article} numberOfLines={5}>
          {props.payload.text}
        </Text>
      </Pressable>
      <DynamicStat
        title={props.payload.text}
        name={props.name}
        id={props.id}
        date={props.date}
        like={props.likeCount}
        share={props.forwardCount}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  title: { marginBottom: 10, fontSize: 16 },
  article: { backgroundColor: '#e6e6e6', padding: 8 },
})
