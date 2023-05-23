import React from 'react'
import { View, Image } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import RichTexts from '../../components/RichTexts'
import { Text } from '@rneui/themed'

export default function CommonItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_COMMON_SQUARE>,
) {
  return (
    <View style={{ gap: 10 }}>
      <RichTexts idStr={props.id} nodes={props.richTexts} topic={props.topic} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Image
          source={{ uri: props.payload.cover }}
          style={{
            width: 160,
            height: 80,
            borderRadius: 4,
          }}
        />
        <View style={{ gap: 10, flexShrink: 1 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 15 }}>
            {props.payload.title}
          </Text>
          <Text style={{ fontSize: 15 }} numberOfLines={3}>
            {props.payload.text}
          </Text>
        </View>
      </View>
    </View>
  )
}
