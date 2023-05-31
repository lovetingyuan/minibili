import React from 'react'
import { TouchableOpacity } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import { OtherDynamicTypeEnum } from '../../api/dynamic-items.type'
import RichTexts from '../../components/RichTexts'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'

export default function DefaultItem(props: {
  item: DynamicItemType<OtherDynamicTypeEnum>
}) {
  const { item } = props
  const nodes = item.desc?.rich_text_nodes
  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        navigation.navigate('WebPage', {
          title: item.name + '的动态',
          url: `https://m.bilibili.com/dynamic/${item.id}`,
        })
      }}>
      <RichTexts idStr={item.id} nodes={nodes} />
    </TouchableOpacity>
  )
}
