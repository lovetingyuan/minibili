import React from 'react'
import { Text, View, Image } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
// import RichText from '../../components/RichText'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import RichTexts from '../../components/RichTexts'
import { useRoute } from '@react-navigation/native'

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
      {/* <RichText
        imageSize={16}
        text={props.text}
        textProps={{ style: { fontSize: 16, lineHeight: 24 } }}
      /> */}
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
