import React from 'react'
import { DynamicItemType } from '../../api/dynamic-items'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'
import store from '../../store'
import { Button, Image } from '@rneui/themed'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import { View } from 'react-native'

export default function WordItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_LIVE_RCMD>,
) {
  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Image
        source={require('../../../assets/live.png')}
        style={{ width: 30, height: 30 }}
      />
      <Button
        title={'UP主正在直播~'}
        buttonStyle={{ justifyContent: 'flex-start' }}
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
    </View>
  )
}
