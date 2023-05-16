import React from 'react'
import { View, Text, Image } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import RichText from '../../components/RichText'

export default function CommonItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_COMMON_SQUARE>,
) {
  return (
    <View style={{ gap: 10 }}>
      <RichText text={props.text} />
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
