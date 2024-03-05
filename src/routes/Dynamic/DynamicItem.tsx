import { useRoute } from '@react-navigation/native'
import React from 'react'
import { Text, View } from 'react-native'

import { colors } from '@/constants/colors.tw'

import type { DynamicItemAllType } from '../../api/dynamic-items'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import CommonItem from './CommonItem'
import DefaultItem from './DefaultItem'
import DynamicStat from './DynamicStat'
import ForwardItem from './ForwardItem'
import VideoItem from './VideoItem'
import WordDrawItem from './WordDrawItem'

export default function DynamicItem({ item }: { item: DynamicItemAllType }) {
  let Item: React.FC<any> = DefaultItem
  const route = useRoute()
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_LIVE_RCMD) {
    return null
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_AV) {
    Item = VideoItem
  } else if (
    item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_WORD ||
    item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_DRAW
  ) {
    Item = WordDrawItem
  } else if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD) {
    Item = ForwardItem
  } else if (
    item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_COMMON_SQUARE ||
    item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_MUSIC ||
    item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_PGC ||
    item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_ARTICLE
  ) {
    Item = CommonItem
  }
  if (route.name === 'DynamicDetail') {
    return <Item item={item} />
  }
  // https://m.bilibili.com/dynamic/710533241871794180?spm_id_from=333.999.0.0
  return (
    <View className="py-5 px-3 border-b-[0.5px] border-b-gray-400">
      {item.top ? (
        <Text
          className={`self-start px-2 text-left border mb-2 ${colors.secondary.border} rounded flex-1 font-thin text-sm ${colors.secondary.text}`}>
          置顶
        </Text>
      ) : null}
      <Item item={item} />
      {/* {__DEV__ && <Text>{item.type}</Text>} */}
      {item.type !== HandledDynamicTypeEnum.DYNAMIC_TYPE_AV && (
        <DynamicStat
          title={item.text || ''}
          name={item.name}
          id={item.commentId}
          date={item.date}
          like={item.likeCount}
          share={item.forwardCount}
        />
      )}
    </View>
  )
}
