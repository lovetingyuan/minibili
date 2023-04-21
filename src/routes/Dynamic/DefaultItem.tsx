import { useNavigation } from '@react-navigation/native'
import { Button } from '@rneui/themed'
import React from 'react'
import { View } from 'react-native'
import { useSnapshot } from 'valtio'
import { DynamicItemType } from '../../api/dynamic-items'
import RichText from '../../components/RichText'
import store from '../../store'
import { NavigationProps } from '../../types'
import DynamicStat from './DynamicStat'
import { DynamicTypeEnum } from '../../api/dynamic-items.schema'

export default function DefaultItem(props: DynamicItemType<DynamicTypeEnum>) {
  const { livingUps } = useSnapshot(store)
  const liveUrl = livingUps[props.mid]
  const navigation = useNavigation<NavigationProps['navigation']>()
  // if (
  //   'type' in props.payload &&
  //   props.payload.type === DynamicTypeEnum.DYNAMIC_TYPE_LIVE_RCMD
  // ) {
  //   return (
  //     <Button
  //       type="clear"
  //       size="sm"
  //       buttonStyle={{ width: 120 }}
  //       onPress={() => {
  //         navigation.navigate('WebPage', {
  //           url: liveUrl,
  //           title: props.name + '的直播间',
  //         })
  //       }}>
  //       UP主正在直播~
  //     </Button>
  //   )
  // }
  return (
    <View>
      <RichText
        imageSize={16}
        text={props.text}
        textProps={{ style: { fontSize: 16, lineHeight: 24 } }}
      />
      <DynamicStat
        title={props.text || ''}
        name={props.name}
        id={props.id}
        date={props.date}
        like={props.likeCount}
        share={props.forwardCount}
      />
    </View>
  )
}
