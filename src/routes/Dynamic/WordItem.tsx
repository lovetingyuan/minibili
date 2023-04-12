import React from 'react'
import { TouchableOpacity, Linking, Text } from 'react-native'
import { DynamicItemType, DynamicTypeEnum } from '../../api/dynamic-items'
import RichText from '../../components/RichText'
import DateAndOpen from './DateAndOpen'

export default function WordItem(
  props: DynamicItemType<DynamicTypeEnum.DYNAMIC_TYPE_WORD>,
) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        Linking.openURL(`https://m.bilibili.com/dynamic/${props.commentId}`)
      }}>
      <RichText
        imageSize={16}
        text={props.text}
        textProps={{ style: { fontSize: 16, lineHeight: 24 } }}
      />
      {props.payload.text ? (
        <Text style={{ marginTop: 10, backgroundColor: '#e6e6e6', padding: 8 }}>
          {props.payload.text}
        </Text>
      ) : null}
      <DateAndOpen
        title={props.text || ''}
        name={props.name}
        id={props.id}
        date={props.date}
      />
    </TouchableOpacity>
  )
}
