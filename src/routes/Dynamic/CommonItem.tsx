import React from 'react'
import {
  View,
  Pressable,
  Linking,
  useWindowDimensions,
  StyleSheet,
} from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import { HandledDynamicTypeEnum } from '../../api/dynamic-items.type'
import RichTexts from '../../components/RichTexts'
import { Text } from '@rneui/themed'
import { Image } from 'expo-image'

export default function CommonItem(
  props: DynamicItemType<
    | HandledDynamicTypeEnum.DYNAMIC_TYPE_COMMON_SQUARE
    | HandledDynamicTypeEnum.DYNAMIC_TYPE_MUSIC
    | HandledDynamicTypeEnum.DYNAMIC_TYPE_ARTICLE
    | HandledDynamicTypeEnum.DYNAMIC_TYPE_PGC
  >,
) {
  return (
    <View style={styles.container}>
      <RichTexts idStr={props.id} nodes={props.richTexts} topic={props.topic} />
      <CommonContent {...props.payload} />
    </View>
  )
}

/**
 * 这个组件为普通动态和转发动态共同使用
 */
export function CommonContent(props: {
  url: string
  title: string
  text: string
  cover: string
  forward?: boolean
}) {
  const { url, title, text, cover, forward } = props
  const Foo = url ? Pressable : View
  const { width } = useWindowDimensions()
  const linkProp = url
    ? {
        onPress: () => {
          Linking.openURL(url)
        },
      }
    : {}
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {cover ? (
          <Image
            source={{ uri: cover + '@240w_140h_1c.webp' }}
            style={{
              width: width * 0.4,
              height: width * 0.23,
              borderRadius: 4,
            }}
          />
        ) : null}
        <Foo style={styles.textContainer} {...linkProp}>
          {title ? (
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
          ) : null}
          {text ? (
            <Text
              style={[forward ? styles.forwardContent : styles.content]}
              numberOfLines={3}>
              {text}
            </Text>
          ) : null}
        </Foo>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  title: { fontWeight: 'bold', fontSize: 15 },
  textContainer: { gap: 6, flexShrink: 1 },
  content: { fontSize: 15 },
  forwardContent: { fontSize: 14 },
  contentContainer: { flexDirection: 'row', gap: 10 },
})
