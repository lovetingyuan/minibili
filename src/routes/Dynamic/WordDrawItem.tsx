import React from 'react'
import { View, TouchableOpacity, useWindowDimensions } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import { useNavigation, useRoute } from '@react-navigation/native'
import RichTexts from '../../components/RichTexts'
import { Image } from 'expo-image'
import { Additional } from '../../components/Additional'
import { NavigationProps } from '../../types'
import { imgUrl } from '../../utils'
import { useStore } from '../../store'
import { Text } from '@rneui/themed'

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
    <View className="flex-1 flex-row overflow-hidden">
      {images.map((img, i) => {
        const ImageCmp = (
          <Image
            key={img.src + i}
            className="w-24 h-24 mr-1 rounded"
            source={{
              uri: imgUrl(img.src, 240),
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
      ? width / 3 - 10
      : images.length === 2
        ? width / 2 - 15
        : width / 2
  const imageList = (
    <View className="flex-wrap flex-row gap-1 mb-5">
      {images.map((img, i) => {
        const ImageCmp = (
          <Image
            key={img.src + i}
            className="aspect-square rounded"
            style={{ width: imageListWidth }}
            source={{
              uri: imgUrl(img.src, 240),
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
      {title ? <Text className="font-bold text-base">{title}</Text> : null}
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
