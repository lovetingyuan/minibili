import React from 'react'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import { TouchableOpacity, Image, StyleSheet, Text } from 'react-native'
import ForwardItem from './ForwardItem'
import RichTextItem from './DrawItem'
import VideoItem from './VideoItem'
import LivingItem from './LivingItem'
import WordItem from './WordItem'
import MusicItem from './MusicItem'

import DefaultItem from './DefaultItem'
import ArticleItem from './ArticleItem'
import DynamicStat from './DynamicStat'
import { useRoute } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'
import { DynamicItemAllType } from '../../api/dynamic-items'

export default function DynamicItem({ item }: { item: DynamicItemAllType }) {
  let Item: React.FC<any> = DefaultItem
  const route = useRoute()
  const navigation = useNavigation<NavigationProps['navigation']>()

  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_AV) {
    Item = VideoItem
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_WORD) {
    Item = WordItem
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_DRAW) {
    Item = RichTextItem
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_ARTICLE) {
    Item = ArticleItem
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD) {
    Item = ForwardItem
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_LIVE_RCMD) {
    Item = LivingItem
  }
  if (item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_MUSIC) {
    Item = MusicItem
  }
  if (route.name === 'DynamicDetail') {
    return <Item {...item} />
  }
  // https://m.bilibili.com/dynamic/710533241871794180?spm_id_from=333.999.0.0
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.itemContainer]}
      onPress={() => {
        if (item.type !== HandledDynamicTypeEnum.DYNAMIC_TYPE_AV) {
          navigation?.navigate('DynamicDetail', {
            detail: item,
          })
        }
      }}>
      {item.top ? (
        <Image
          source={require('../../../assets/top.png')}
          style={styles.topMark}
        />
      ) : null}
      <Item {...item} />
      {__DEV__ && <Text>{item.type}</Text>}
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
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  topMark: { width: 30, height: 15, marginBottom: 5 },
  itemContainer: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderBottomColor: '#ccc',
    borderBottomWidth: 0.5,
  },
})
