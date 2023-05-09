import React from 'react'
import { View } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import RichText from '../../components/RichText'

export default function DefaultItem(props: DynamicItemType) {
  return (
    <View>
      <RichText
        imageSize={16}
        text={props.text}
        textProps={{ style: { fontSize: 16, lineHeight: 24 } }}
      />
    </View>
  )
}
