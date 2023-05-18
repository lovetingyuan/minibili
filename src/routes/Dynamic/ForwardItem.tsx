import React from 'react'
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import RichText from '../../components/RichText'
import { DynamicItemType } from '../../api/dynamic-items'
import {
  HandledDynamicTypeEnum,
  HandledForwardTypeEnum,
} from '../../api/dynamic-items.type'
import { Avatar } from '@rneui/themed'
import RichTexts from '../../components/RichTexts'

export default function ForwardItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD>,
) {
  const { width } = useWindowDimensions()
  let forwardContent = <Text>暂不支持显示</Text>
  if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_AV) {
    forwardContent = (
      <View style={{ flexDirection: 'column', flex: 1 }}>
        {props.payload.text ? (
          <Text style={{ marginBottom: 10, fontSize: 16 }}>
            {props.payload.text}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row' }}>
          <Image
            style={styles.forwardContentImage}
            source={{ uri: props.payload.cover + '@240w_240h_1c.webp' }}
          />
          <Text numberOfLines={3} style={{ flex: 6 }}>
            {props.payload.title}
          </Text>
        </View>
      </View>
    )
  } else if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_DRAW) {
    forwardContent = (
      <View style={{ flexDirection: 'column' }}>
        <View style={{ maxHeight: 50 }}>
          <RichText
            text={props.payload.text}
            textProps={{ numberOfLines: 3 }}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={styles.imagesContainer}>
          {props.payload.images.map(img => {
            return (
              <Image
                style={[styles.image, { aspectRatio: img.ratio }]}
                key={img.src}
                source={{ uri: img.src + '@240w_240h_1c.webp' }}
              />
            )
          })}
        </ScrollView>
        {/* {props.payload.text2 ? <Text>{props.payload.text2}</Text> : null} */}
      </View>
    )
  } else if (
    props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_ARTICLE
  ) {
    forwardContent = (
      <View>
        <Text style={{ fontSize: 15, marginBottom: 10, fontWeight: 'bold' }}>
          {props.payload.title}
        </Text>
        <Text numberOfLines={3}>{props.payload.text}</Text>
      </View>
    )
  } else if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_WORD) {
    forwardContent = <Text numberOfLines={3}>{props.payload.text}</Text>
  } else if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_LIVE) {
    forwardContent = (
      <View>
        <Text>{props.payload.title}</Text>
        <Image
          source={{ uri: props.payload.cover }}
          style={{ width: 100, height: 50, marginTop: 5, borderRadius: 4 }}
        />
      </View>
    )
  } else if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_MUSIC) {
    forwardContent = (
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Image
          source={{ uri: props.payload.cover }}
          style={{
            width: 100,
            height: 80,
            borderRadius: 4,
          }}
        />
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
            {props.payload.title}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: 'normal' }}>
            {props.payload.label}
          </Text>
        </View>
      </View>
    )
  } else if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_PGC) {
    forwardContent = (
      <View style={{ gap: 10, flexDirection: 'row', flexShrink: 1 }}>
        <Image
          source={{ uri: props.payload.cover }}
          style={{
            width: width * 0.4,
            height: 80,
            borderRadius: 4,
          }}
        />
        <View style={{ flexShrink: 1 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
            {props.payload.title}
          </Text>
          <Text style={{ marginTop: 12, lineHeight: 23 }}>
            {props.payload.text}
          </Text>
        </View>
      </View>
    )
  } else if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_NONE) {
    forwardContent = (
      <Text style={{ fontStyle: 'italic' }}>{props.payload.text}</Text>
    )
  }
  return (
    <View style={[styles.textContainer]}>
      <RichTexts nodes={props.richTexts} />
      {/* <RichText
        imageSize={16}
        text={props.text}
        textProps={{
          style: {
            fontSize: 16,
            color: props.top ? '#00699D' : 'black',
            lineHeight: 24,
          },
        }}
      /> */}
      <View style={styles.forwardContainer}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
          }}>
          {props.payload.face && (
            <Avatar source={{ uri: props.payload.face }} size={24} rounded />
          )}
          {props.payload.name && (
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>
              {props.payload.name}
            </Text>
          )}
        </View>
        <View style={styles.forwardContent}>{forwardContent}</View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  textItem: {
    fontSize: 16,
    lineHeight: 26,
  },
  image: {
    height: 80,
    marginRight: 20,
    marginVertical: 10,
    borderRadius: 4,
  },
  textContainer: {
    flex: 1,
  },
  forwardContainer: {
    flex: 1,
    marginBottom: 8,
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 10,
    borderRadius: 4,
  },
  forwardContent: {
    flex: 1,
    flexDirection: 'row',
  },
  forwardContentImage: {
    width: 150,
    height: 80,
    marginRight: 10,
    flex: 4,
    borderRadius: 4,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  date: { color: '#555', fontSize: 12 },
  imagesContainer: {},
})
