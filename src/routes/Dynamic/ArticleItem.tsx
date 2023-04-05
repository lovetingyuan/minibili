import React from 'react'
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native'
import { DynamicItemType, DynamicTypeEnum } from '../../api/dynamic-items'
import DateAndOpen from './DateAndOpen'

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
      <DateAndOpen
        title={props.payload.text}
        name={props.name}
        id={props.id}
        date={props.date}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  title: { marginBottom: 10, fontSize: 16 },
  article: { backgroundColor: '#e6e6e6', padding: 8 },
})
