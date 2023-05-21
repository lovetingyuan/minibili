import React from 'react'
import { View, Image } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import RichTexts from '../../components/RichTexts'
import { useRoute } from '@react-navigation/native'
import { Text } from '@rneui/themed'

export default function WordItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_WORD>,
) {
  const route = useRoute()
  const isDetail = route.name === 'DynamicDetail'
  return (
    <>
      <RichTexts
        nodes={props.richTexts}
        topic={props.topic}
        textProps={isDetail ? {} : { numberOfLines: 5 }}
      />
      {props.payload.text || props.payload.image ? (
        <View style={{ marginTop: 10 }}>
          {props.payload.text ? <Text>{props.payload.text}</Text> : null}
          {props.payload.image ? (
            <Image
              source={{ uri: props.payload.image }}
              style={{ width: 150, height: 80, marginTop: 10 }}
            />
          ) : null}
        </View>
      ) : null}
    </>
  )
}
