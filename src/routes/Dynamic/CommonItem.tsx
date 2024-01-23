import React from 'react'
import {
  View,
  Pressable,
  Linking,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import {
  HandledDynamicTypeEnum,
  HandledForwardTypeEnum,
} from '../../api/dynamic-items.type'
import RichTexts from '../../components/RichTexts'
import { Text } from '@rneui/themed'
import { Image } from 'expo-image'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'
import { imgUrl } from '../../utils'

type ItemType =
  | HandledDynamicTypeEnum.DYNAMIC_TYPE_COMMON_SQUARE
  | HandledDynamicTypeEnum.DYNAMIC_TYPE_MUSIC
  | HandledDynamicTypeEnum.DYNAMIC_TYPE_ARTICLE
  | HandledDynamicTypeEnum.DYNAMIC_TYPE_PGC

export default function CommonItem(props: { item: DynamicItemType<ItemType> }) {
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
      <RichTexts idStr={item.id} nodes={nodes} topic={item.topic} />
      <CommonContent type={item.type} {...item.payload} />
    </TouchableOpacity>
  )
}

// const cateMap = {
//   [HandledDynamicTypeEnum.DYNAMIC_TYPE_PGC]: '影视',
//   [HandledDynamicTypeEnum.DYNAMIC_TYPE_ARTICLE]: '文章',
//   [HandledForwardTypeEnum.DYNAMIC_TYPE_COURSES_SEASON]: '课程',
//   [HandledForwardTypeEnum.DYNAMIC_TYPE_MEDIALIST]: '收藏夹',
//   [HandledForwardTypeEnum.DYNAMIC_TYPE_LIVE]: '直播',
//   [HandledDynamicTypeEnum.DYNAMIC_TYPE_MUSIC]: '音乐',
//   [HandledForwardTypeEnum.DYNAMIC_TYPE_COMMON_SQUARE]: '其它',
// }

/**
 * 这个组件为普通动态和转发动态共同使用
 */
export function CommonContent(props: {
  type: HandledDynamicTypeEnum | HandledForwardTypeEnum
  url: string
  title: string
  text: string
  cover: string
  badge?: string
  forward?: boolean
}) {
  const { url, title, text, cover, forward } = props
  const Foo = url ? Pressable : View
  const { width } = useWindowDimensions()
  const navigation = useNavigation<NavigationProps['navigation']>()

  const linkProp = url
    ? {
        onPress: () => {
          if (props.type === HandledForwardTypeEnum.DYNAMIC_TYPE_ARTICLE) {
            navigation.push('WebPage', {
              title,
              url,
            })
          } else {
            Linking.openURL(url)
          }
        },
      }
    : {}
  return (
    <View className="flex-row gap-3 rounded pr-3">
      {cover ? (
        <Image
          source={{ uri: imgUrl(cover, 240, 150) }}
          className="aspect-[8/5] rounded"
          style={{
            width: width * 0.35,
          }}
        />
      ) : null}
      <Foo className="gap-2 shrink" {...linkProp}>
        {title ? (
          <Text
            className={[
              props.type === HandledDynamicTypeEnum.DYNAMIC_TYPE_ARTICLE
                ? 'font-bold'
                : '',
              'text-base',
            ].join(' ')}
            numberOfLines={2}>
            {title}
          </Text>
        ) : null}
        {text ? (
          <Text className={forward ? 'text-sm' : 'text-base'} numberOfLines={2}>
            {text}
          </Text>
        ) : null}
      </Foo>
    </View>
  )
}
