import React from 'react'
import { View, Text } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import RichText from '../../components/RichText'
import { OtherDynamicTypeEnum } from '../../api/dynamic-items.type'

export default function DefaultItem(
  props: DynamicItemType<OtherDynamicTypeEnum>,
) {
  return (
    <View>
      <RichText
        imageSize={16}
        text={props.text}
        textProps={{ style: { fontSize: 16, lineHeight: 24 } }}
      />
      <Text style={{ marginTop: 10 }}>{props.payload.text}</Text>
    </View>
  )
}
