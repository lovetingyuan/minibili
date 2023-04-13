import React from 'react'
import { TouchableOpacity, Text, View, Image } from 'react-native'
import { DynamicItemType, DynamicTypeEnum } from '../../api/dynamic-items'
import RichText from '../../components/RichText'
import DateAndOpen from './DateAndOpen'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'

export default function WordItem(
  props: DynamicItemType<DynamicTypeEnum.DYNAMIC_TYPE_WORD>,
) {
  const navigation = useNavigation<NavigationProps['navigation']>()
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        navigation.navigate('DynamicDetail', {
          detail: props,
        })
        // Linking.openURL(`https://m.bilibili.com/dynamic/${props.commentId}`)
      }}>
      <RichText
        imageSize={16}
        text={props.text}
        textProps={{ style: { fontSize: 16, lineHeight: 24 } }}
      />
      <View style={{ marginTop: 10, backgroundColor: '#e6e6e6', padding: 8 }}>
        {props.payload.text ? (
          <Text style={{}}>{props.payload.text}</Text>
        ) : null}
        {props.payload.image ? (
          <Image
            source={{ uri: props.payload.image }}
            style={{ width: 150, height: 80, marginTop: 10 }}
          />
        ) : null}
      </View>
      <DateAndOpen
        title={props.text || ''}
        name={props.name}
        id={props.id}
        date={props.date}
      />
    </TouchableOpacity>
  )
}
