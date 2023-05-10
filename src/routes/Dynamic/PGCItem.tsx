import React from 'react'
import { View, Text, Image } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
// import RichText from '../../components/RichText'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'

export default function MusicItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_PGC>,
) {
  return (
    <View>
      <Text style={{ fontWeight: 'bold' }}>{props.payload.title}</Text>
      <Text>{props.payload.text}</Text>
      <Image
        source={{ uri: props.payload.cover }}
        style={{
          width: 120,
        }}
      />
    </View>
  )
}
