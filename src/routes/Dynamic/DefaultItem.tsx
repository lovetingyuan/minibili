import React from 'react'
import { View } from 'react-native'
import { DynamicItemType, DynamicTypeEnum } from '../../api/dynamic-items'
import RichText from '../../components/RichText'
import DateAndOpen from './DateAndOpen'

export default function DefaultItem(
  props: DynamicItemType<DynamicTypeEnum.DYNAMIC_TYPE_UNKNOWN>,
) {
  return (
    <View>
      <RichText
        imageSize={16}
        text={props.text}
        textProps={{ style: { fontSize: 16, lineHeight: 24 } }}
      />
      <DateAndOpen
        title={props.text || ''}
        name={props.name}
        id={props.id}
        date={props.date}
      />
    </View>
  )
}
