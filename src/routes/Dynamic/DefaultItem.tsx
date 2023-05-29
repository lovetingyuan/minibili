import React from 'react'
import { View } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import { OtherDynamicTypeEnum } from '../../api/dynamic-items.type'
import RichTexts from '../../components/RichTexts'

export default function DefaultItem(
  props: DynamicItemType<OtherDynamicTypeEnum>,
) {
  const nodes = props.desc?.rich_text_nodes
  return (
    <View>
      <RichTexts idStr={props.id} nodes={nodes} />
    </View>
  )
}
