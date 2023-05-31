import React from 'react'
import {
  StyleSheet,
  View,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import store from '../../store'
import { useNavigation, useRoute } from '@react-navigation/native'
import RichTexts from '../../components/RichTexts'
import { Image } from 'expo-image'
import { Additional } from '../../components/Additional'
import { NavigationProps } from '../../types'

export default function WordDrawItem(props: {
  item: DynamicItemType<
    | HandledDynamicTypeEnum.DYNAMIC_TYPE_DRAW
    | HandledDynamicTypeEnum.DYNAMIC_TYPE_WORD
  >
}) {
  const {
    item: {
      id,
      desc,
      topic,
      payload: { images, additional },
    },
  } = props
  const richTextNodes = desc?.rich_text_nodes
  const route = useRoute()
  const isDetail = route.name === 'DynamicDetail'
  const { width } = useWindowDimensions()
  const navigation = useNavigation<NavigationProps['navigation']>()

  const scrollImages = (
    <View style={styles.imagesContainer}>
      {images.map((img, i) => {
        const ImageCmp = (
          <Image
            key={img.src + i}
            style={[styles.image]}
            contentFit="cover"
            source={{
              uri: img.src + '@240w_240h_1c.webp',
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
              store.imagesList = images.slice()
              store.currentImageIndex = i
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
    <View style={styles.imageListContainer}>
      {images.map((img, i) => {
        const ImageCmp = (
          <Image
            key={img.src + i}
            style={[{ aspectRatio: 1, width: imageListWidth, borderRadius: 4 }]}
            contentFit="cover"
            source={{
              uri: img.src + '@240w_240h_1c.webp',
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
              store.imagesList = images.slice()
              store.currentImageIndex = i
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
      {images.length ? (isDetail ? imageList : scrollImages) : null}
      <Additional additional={additional} />
    </>
  )
  if (isDetail) {
    return <View style={[styles.textContainer]}>{content}</View>
  }
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.textContainer]}
      onPress={() => {
        navigation?.navigate('DynamicDetail', {
          detail: props.item,
        })
      }}>
      {content}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  textItem: {
    fontSize: 16,
    lineHeight: 26,
  },
  image: {
    height: 100,
    width: 100,
    marginRight: 5,
    marginVertical: 10,
    borderRadius: 4,
  },
  textContainer: {
    flex: 1,
  },
  imagesContainer: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  date: { color: '#555', fontSize: 12 },
  postText: {
    marginTop: 5,
    // fontStyle: 'italic',
    borderLeftWidth: 0.5,
    paddingLeft: 8,
    borderLeftColor: '#aaa',
    lineHeight: 20,
  },
  imageListContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: 4,
    // justifyContent: 'center',
    marginVertical: 20,
  },
  additionalContainer: {
    borderLeftWidth: 1,
    borderLeftColor: '#bbb',
    paddingLeft: 8,
    marginTop: 8,
    paddingVertical: 2,
  },
})
