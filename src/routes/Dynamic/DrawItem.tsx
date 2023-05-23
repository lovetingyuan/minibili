import React from 'react'
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import store from '../../store'
import { useRoute } from '@react-navigation/native'
import RichTexts from '../../components/RichTexts'
import { Text } from '@rneui/themed'
import { Image } from 'expo-image'

export default function RichTextItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_DRAW>,
) {
  const {
    // text,
    payload: { images },
  } = props
  const route = useRoute()
  const isDetail = route.name === 'DynamicDetail'
  const { width } = useWindowDimensions()
  const scrollImages = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      style={styles.imagesContainer}>
      {images.map((img, i) => {
        const ImageCmp = (
          <Image
            key={img.src}
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
            key={img.src}
            activeOpacity={0.8}
            onPress={() => {
              store.imagesList = images.slice()
              store.currentImageIndex = i
            }}>
            {ImageCmp}
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
  const imageListWidth = images.length > 2 ? width / 3 - 10 : width / 2 - 15
  const imageList = (
    <View style={styles.imageListContainer}>
      {images.map((img, i) => {
        const ImageCmp = (
          <Image
            key={img.src}
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
            key={img.src}
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
  return (
    <View style={[styles.textContainer]}>
      <RichTexts
        idStr={props.id}
        nodes={props.richTexts}
        topic={props.topic}
        textProps={isDetail ? {} : { numberOfLines: 4 }}
      />
      {images.length ? (isDetail ? imageList : scrollImages) : null}
      {props.payload.text ? (
        <Text style={styles.postText}>{props.payload.text}</Text>
      ) : null}
    </View>
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
    gap: 5,
    // justifyContent: 'center',
    marginVertical: 20,
  },
})
