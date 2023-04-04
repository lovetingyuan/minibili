import React from 'react'
import { View, Text, Pressable, Linking } from 'react-native'
import { DynamicItemType, DynamicTypeEnum } from '../../api/dynamic-items'
// import RichText from '../../components/RichText'
import DateAndOpen from './DateAndOpen'

export default function ArticleItem(
  props: DynamicItemType<DynamicTypeEnum.DYNAMIC_TYPE_ARTICLE>,
) {
  return (
    <View>
      <Text style={{ marginBottom: 10, fontSize: 16 }}>
        {props.payload.title}
      </Text>
      <Pressable
        onPress={() => {
          Linking.openURL(props.payload.url)
        }}>
        <Text
          style={{ backgroundColor: '#e6e6e6', padding: 8 }}
          numberOfLines={5}>
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
