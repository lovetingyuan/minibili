import React from 'react'
import { Text, View } from 'react-native'
import RichText from '../../components/RichText'
import DateAndOpen from './DateAndOpen'

export default function WordItem(props: {
  date: string
  id: string
  text: string
  name: string
  additionalText?: string
}) {
  return (
    <View>
      <RichText
        imageSize={16}
        text={props.text}
        textProps={{ style: { fontSize: 16, lineHeight: 24 } }}
      />
      {props.additionalText ? (
        <Text style={{ marginTop: 10 }}>{props.additionalText}</Text>
      ) : null}
      <DateAndOpen
        title={props.text}
        name={props.name}
        id={props.id}
        date={props.date}
      />
    </View>
  )
}
