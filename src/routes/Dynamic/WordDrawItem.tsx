import React from 'react'
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  useWindowDimensions,
  Pressable,
  Linking,
} from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import {
  HandledAdditionalTypeEnum,
  HandledDynamicTypeEnum,
} from '../../api/dynamic-items.type'
import store from '../../store'
import { useRoute } from '@react-navigation/native'
import RichTexts from '../../components/RichTexts'
import { Text } from '@rneui/themed'
import { Image } from 'expo-image'
import { AdditionalType } from '../../api/dynamic-items.schema'
import { parseUrl } from '../../utils'
import { parseDate } from '../../utils'
import { parseNumber } from '../../utils'

export const Additional = (props: { additional?: AdditionalType | null }) => {
  const { additional } = props
  if (!additional) {
    return null
  }
  let additionalContent = <Text>暂不支持</Text>
  let url = ''
  if (additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_RESERVE) {
    const desc = [
      additional.reserve.desc1?.text,
      additional.reserve.desc2?.text,
    ]
      .filter(Boolean)
      .join('  ')
    url = additional.reserve.jump_url
    additionalContent = (
      <View style={{ gap: 4 }}>
        <Text>{additional.reserve.title}</Text>
        {desc ? <Text>{desc}</Text> : null}
      </View>
    )
  } else if (
    additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_UGC
  ) {
    const text = [
      additional.ugc.head_text,
      additional.ugc.desc_second,
      additional.ugc.duration,
    ]
      .filter(Boolean)
      .join('  ')
    url = additional.ugc.jump_url
    additionalContent = (
      <View style={{ gap: 10, flexDirection: 'row', paddingRight: 10 }}>
        <Image
          source={{ uri: additional.ugc.cover + '@240w_140h_1c.webp' }}
          style={{ width: 120, minHeight: 70, borderRadius: 4 }}
        />
        <View style={{ flexShrink: 1, gap: 8 }}>
          <Text numberOfLines={2}>{additional.ugc.title}</Text>
          {text ? <Text numberOfLines={2}>{text}</Text> : null}
        </View>
      </View>
    )
  } else if (
    additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_COMMON
  ) {
    const text = [
      additional.common.head_text,
      additional.common.desc1,
      additional.common.desc2,
    ]
      .filter(Boolean)
      .join('  ')
    url = additional.common.jump_url
    additionalContent = (
      <View style={{ gap: 10, flexDirection: 'row', paddingRight: 10 }}>
        <Image
          source={{ uri: additional.common.cover + '@240w_140h_1c.webp' }}
          style={{ width: 120, minHeight: 70, borderRadius: 4 }}
        />
        <View style={{ flexShrink: 1, gap: 8 }}>
          <Text numberOfLines={2}>{additional.common.title}</Text>
          {text ? <Text numberOfLines={2}>{text}</Text> : null}
        </View>
      </View>
    )
  } else if (
    additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_GOODS
  ) {
    const text = [
      additional.goods.items[0]?.name,
      additional.goods.items[0]?.price,
    ]
      .filter(Boolean)
      .join(' ')
    url = additional.goods.jump_url || additional.goods.items[0].jump_url
    additionalContent = (
      <View style={{ gap: 4 }}>
        <Text>商品：{additional.goods.head_text}</Text>
        {text ? <Text numberOfLines={1}>{text}</Text> : null}
      </View>
    )
  } else if (
    additional.type === HandledAdditionalTypeEnum.ADDITIONAL_TYPE_VOTE
  ) {
    url =
      'https://t.bilibili.com/vote/h5/index/#/result?vote_id=' +
      additional.vote.vote_id
    additionalContent = (
      <View style={{ gap: 4 }}>
        <Text>投票：{additional.vote.desc}</Text>
        <Text>
          {parseDate(additional.vote.end_time)}截至，
          {parseNumber(additional.vote.join_num) || 0}人参与
        </Text>
      </View>
    )
  }
  const Foo = url ? Pressable : View
  const linkProp = url
    ? {
        onPress: () => {
          Linking.openURL(parseUrl(url))
        },
      }
    : {}
  return (
    <Foo {...linkProp} style={styles.additionalContainer}>
      {additionalContent}
    </Foo>
  )
}

export default function WordDrawItem(
  props: DynamicItemType<
    | HandledDynamicTypeEnum.DYNAMIC_TYPE_DRAW
    | HandledDynamicTypeEnum.DYNAMIC_TYPE_WORD
  >,
) {
  const {
    id,
    richTexts,
    topic,
    payload: { images, additional },
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
    </ScrollView>
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
  return (
    <View style={[styles.textContainer]}>
      <RichTexts
        idStr={id}
        nodes={richTexts}
        topic={topic}
        textProps={isDetail ? {} : { numberOfLines: 4 }}
      />
      {images.length ? (isDetail ? imageList : scrollImages) : null}
      <Additional additional={additional} />
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
    width: 110,
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
