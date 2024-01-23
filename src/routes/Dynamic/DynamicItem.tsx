import React from 'react'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import { View, Image } from 'react-native'
import ForwardItem from './ForwardItem'
import VideoItem from './VideoItem'
import WordDrawItem from './WordDrawItem'
import DefaultItem from './DefaultItem'
import CommonItem from './CommonItem'
import DynamicStat from './DynamicStat'
import { useRoute } from '@react-navigation/native'
import { DynamicItemAllType } from '../../api/dynamic-items'
import { useTheme } from '@rneui/themed'

export default function DynamicItem({ item }: { item: DynamicItemAllType }) {
  const { theme } = useTheme()
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
    <View
      className="py-5 px-3 border-b-[0.5px]"
      style={{ borderBottomColor: theme.colors.divider }}>
      {item.top ? (
        <Image
          source={require('../../../assets/top.png')}
          className="w-8 h-5 mb-1"
        />
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
