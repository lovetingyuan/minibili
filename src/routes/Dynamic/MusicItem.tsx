import React from 'react'
import { View, Text, Image } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
// import RichText from '../../components/RichText'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'

export default function MusicItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_MUSIC>,
) {
  return (
    <View>
      <Text>{props.payload.title}</Text>
      <Text>{props.payload.label}</Text>
      <Image
        source={{ uri: props.payload.cover }}
        style={{
          width: 120,
        }}
      />
    </View>
  )
}
