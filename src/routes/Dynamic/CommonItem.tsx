import React from 'react'
import { View, Text, Image } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'

export default function CommonItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_COMMON_SQUARE>,
) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontWeight: 'bold' }}>{props.payload.title}</Text>
      <Text>{props.payload.text}</Text>
      <Image
        source={{ uri: props.payload.cover }}
        style={{
          width: 150,
          height: 70,
        }}
      />
    </View>
  )
}
