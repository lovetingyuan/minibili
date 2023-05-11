import React from 'react'
import {
  Image,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import RichText from '../../components/RichText'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import store from '../../store'
import { useRoute } from '@react-navigation/native'

export default function RichTextItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_DRAW>,
) {
  const {
    text,
    payload: { images },
  } = props
  const route = useRoute()
  const isDetail = route.name === 'DynamicDetail'
  const scrollImages = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      style={styles.imagesContainer}>
      {images.map((img, i) => {
        const ImageCmp = (
          <Image
            key={img.src}
            style={[styles.image, { aspectRatio: img.ratio }]}
            resizeMode="cover"
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
  return (
    <View style={[styles.textContainer]}>
      <RichText
        text={text}
        imageSize={16}
        textProps={{ style: { fontSize: 16, lineHeight: 25 } }}
      />
      {images.length ? scrollImages : null}
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
    height: 110,
    marginRight: 20,
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
    fontStyle: 'italic',
    borderLeftWidth: 0.5,
    paddingLeft: 8,
    borderLeftColor: '#aaa',
    lineHeight: 25,
  },
})
