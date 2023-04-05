import { useNavigation } from '@react-navigation/native'
import { Button } from '@rneui/themed'
import React from 'react'
import { View } from 'react-native'
import { useSnapshot } from 'valtio'
import { DynamicItemType, DynamicTypeEnum } from '../../api/dynamic-items'
import RichText from '../../components/RichText'
import store from '../../store'
import { NavigationProps } from '../../types'
import DateAndOpen from './DateAndOpen'

export default function DefaultItem(
  props: DynamicItemType<DynamicTypeEnum.DYNAMIC_TYPE_UNKNOWN>,
) {
  const { livingUps } = useSnapshot(store)
  const liveUrl = livingUps[props.mid]
  const navigation = useNavigation<NavigationProps['navigation']>()
  if (props.payload.type === DynamicTypeEnum.DYNAMIC_TYPE_LIVE_RCMD) {
    return (
      <Button
        type="clear"
        size="sm"
        buttonStyle={{ width: 110 }}
        onPress={() => {
          navigation.navigate('WebPage', {
            url: liveUrl,
            title: props.name + '的直播间',
          })
        }}>
        UP主正在直播~
      </Button>
    )
  }
  return (
    <View>
      <RichText
        imageSize={16}
        text={props.text}
        textProps={{ style: { fontSize: 16, lineHeight: 24 } }}
      />
      <DateAndOpen
        title={props.text || ''}
        name={props.name}
        id={props.id}
        date={props.date}
      />
    </View>
  )
}
