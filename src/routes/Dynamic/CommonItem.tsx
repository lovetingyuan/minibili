import React from 'react'
import { View, Text, Image } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import RichTexts from '../../components/RichTexts'

export default function CommonItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_COMMON_SQUARE>,
) {
  return (
    <View style={{ gap: 10 }}>
      <RichTexts nodes={props.richTexts} topic={props.topic} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Image
          source={{ uri: props.payload.cover }}
          style={{
            width: 130,
            height: 80,
            borderRadius: 4,
          }}
        />
        <View style={{ gap: 10 }}>
          <Text style={{ fontWeight: 'bold' }}>{props.payload.title}</Text>
          <Text>{props.payload.text}</Text>
        </View>
      </View>
    </View>
  )
}
