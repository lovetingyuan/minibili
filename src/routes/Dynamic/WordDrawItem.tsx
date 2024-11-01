import { useNavigation, useRoute } from '@react-navigation/native'
import { Text } from '@rneui/themed'
import { Image } from 'expo-image'
import React from 'react'
import { TouchableOpacity, useWindowDimensions, View } from 'react-native'

import type { DynamicItemType } from '../../api/dynamic-items'
import type { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import { Additional } from '../../components/Additional'
import RichTexts from '../../components/RichTexts'
import { useStore } from '../../store'
import type { NavigationProps } from '../../types'
import { parseImgUrl } from '../../utils'

export default function WordDrawItem(props: {
  item: DynamicItemType<
    | HandledDynamicTypeEnum.DYNAMIC_TYPE_DRAW
    | HandledDynamicTypeEnum.DYNAMIC_TYPE_WORD
  >
}) {
  const {
    item: { id, desc, topic, payload },
  } = props
  const richTextNodes = desc?.rich_text_nodes
  const route = useRoute()
  const isDetail = route.name === 'DynamicDetail'
  const { width } = useWindowDimensions()
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { setImagesList, setCurrentImageIndex } = useStore()
  const { images, additional, title, texts } = payload
  const scrollImages = (
    <View className="flex-1 flex-row gap-2 overflow-hidden">
      {images.map((img, i) => {
        const ImageCmp = (
          <Image
            key={img.src + i}
            className="mr-1 h-24 w-24 rounded"
            source={{
              uri: parseImgUrl(img.src, 240),
            }}
          />
        )
        if (!isDetail) {
          return ImageCmp
        }
        return (
          <TouchableOpacity
            key={img.src + i}
            activeOpacity={0.8}
            onPress={() => {
              setImagesList(images.slice())
              setCurrentImageIndex(i)
            }}>
            {ImageCmp}
          </TouchableOpacity>
        )
      })}
    </View>
  )
  const imageListWidth =
    images.length > 2
      ? width / 3 - 14
      : images.length === 2
        ? width / 2 - 16
        : width / 2
  const imageList = (
    <View className="mb-5 flex-row flex-wrap gap-2">
      {images.map((img, i) => {
        const ImageCmp = (
          <Image
            key={img.src + i}
            className="aspect-square rounded"
            style={{ width: imageListWidth }}
            source={{
              uri: parseImgUrl(img.src, 240),
            }}
          />
        )
        if (!isDetail) {
          return ImageCmp
        }
        return (
          <TouchableOpacity
            key={img.src + i}
            activeOpacity={0.8}
            onPress={() => {
              setImagesList(images.slice())
              setCurrentImageIndex(i)
            }}>
            {ImageCmp}
          </TouchableOpacity>
        )
      })}
    </View>
  )
  const content = (
    <>
      <RichTexts
        idStr={id}
        nodes={richTextNodes}
        topic={topic}
        textProps={isDetail ? {} : { numberOfLines: 4 }}
      />
      {title ? <Text className="text-base font-bold">{title}</Text> : null}
      {texts.length ? (
        <RichTexts
          idStr={id}
          nodes={texts}
          textProps={isDetail ? {} : { numberOfLines: 4 }}
        />
      ) : null}
      {images.length ? (isDetail ? imageList : scrollImages) : null}
      <Additional additional={additional} />
    </>
  )
  if (isDetail) {
    return <View className="flex-1">{content}</View>
  }
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className="flex-1"
      onPress={() => {
        navigation?.navigate('DynamicDetail', {
          detail: props.item,
        })
      }}>
      {content}
    </TouchableOpacity>
  )
}
