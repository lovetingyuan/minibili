import React from 'react'
import { View } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
// import RichText from '../../components/RichText'
import { OtherDynamicTypeEnum } from '../../api/dynamic-items.type'
import RichTexts from '../../components/RichTexts'

export default function DefaultItem(
  props: DynamicItemType<OtherDynamicTypeEnum>,
) {
  return (
    <View>
      {/* <RichText
        imageSize={16}
        text={props.text}
        textProps={{ style: { fontSize: 16, lineHeight: 24 } }}
      /> */}
      <RichTexts idStr={props.id} nodes={props.richTexts} />
      {/* <Text style={{ marginTop: 10 }}>{props.payload.text}</Text> */}
    </View>
  )
}
