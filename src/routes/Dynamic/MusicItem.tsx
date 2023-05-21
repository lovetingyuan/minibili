import React from 'react'
import { View, Image } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import { Text } from '@rneui/themed'

export default function MusicItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_MUSIC>,
) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
        {props.payload.title}
      </Text>
      <Text>{props.payload.label}</Text>
      <Image
        source={{ uri: props.payload.cover }}
        style={{
          width: 150,
          height: 80,
        }}
      />
    </View>
  )
}
