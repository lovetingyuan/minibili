import React from 'react'
import { DynamicItemType } from '../../api/dynamic-items'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'
import { DynamicTypeEnum } from '../../api/dynamic-items.schema'
import store from '../../store'
import { Button } from '@rneui/themed'

export default function WordItem(
  props: DynamicItemType<DynamicTypeEnum.DYNAMIC_TYPE_LIVE_RCMD>,
) {
  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <Button
      title={props.payload.name + '正在直播'}
      onPress={() => {
        if (store.livingUps[props.payload.mid]) {
          navigation.navigate('WebPage', {
            title: props.payload.name + '的直播间',
            url: store.livingUps[props.payload.mid],
          })
        }
      }}
      type="clear"
    />
  )
}
