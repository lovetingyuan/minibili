import React from 'react'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import { TouchableOpacity, Image, StyleSheet } from 'react-native'
import { Text } from '@rneui/themed'
import ForwardItem from './ForwardItem'
import VideoItem from './VideoItem'
import WordDrawItem from './WordDrawItem'
import DefaultItem from './DefaultItem'
import CommonItem from './CommonItem'
import DynamicStat from './DynamicStat'
import { useRoute } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'
import { DynamicItemAllType } from '../../api/dynamic-items'

export default function DynamicItem({ item }: { item: DynamicItemAllType }) {
  let Item: React.FC<any> = DefaultItem
  const route = useRoute()
  const navigation = useNavigation<NavigationProps['navigation']>()
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
    return <Item {...item} />
  }
  // https://m.bilibili.com/dynamic/710533241871794180?spm_id_from=333.999.0.0
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.itemContainer]}
      onPress={() => {
        if (
          item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_DRAW ||
          item.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_WORD
        ) {
          navigation?.navigate('DynamicDetail', {
            detail: item,
          })
        } else {
          navigation.navigate('WebPage', {
            title: item.name + '的动态',
            url: `https://m.bilibili.com/dynamic/${item.id}`,
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
