import React from 'react'
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  // TouchableOpacity,
} from 'react-native'
import RichText from '../../components/RichText'
import { DynamicItemType } from '../../api/dynamic-items'
// import { useNavigation } from '@react-navigation/native'
// import { NavigationProps } from '../../types'
import {
  HandledDynamicTypeEnum,
  HandledForwardTypeEnum,
  // MajorTypeEnum,
} from '../../api/dynamic-items.type'
// import MusicItem from './MusicItem'

export default function ForwardItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD>,
) {
  // const navigation = useNavigation<NavigationProps['navigation']>()
  // const a = props.payload
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
        <RichText text={props.payload.text} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={styles.imagesContainer}>
          {props.payload.images?.map(img => {
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
        <Text
          numberOfLines={3}
          style={{
            borderWidth: 0.5,
            padding: 6,
            borderRadius: 4,
            borderColor: '#aaa',
          }}>
          {props.payload.text}
        </Text>
      </View>
    )
  } else if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_WORD) {
    forwardContent = <Text>{props.payload.text}</Text>
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
      <View>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
          {props.payload.title}
          <Text style={{ fontSize: 14, fontWeight: 'normal' }}>
            {'    '}
            {props.payload.label}
          </Text>
        </Text>
        <Image
          source={{ uri: props.payload.cover }}
          style={{
            width: 120,
            height: 70,
            marginTop: 10,
            borderRadius: 4,
          }}
        />
      </View>
    )
  } else if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_NONE) {
    forwardContent = (
      <Text style={{ fontStyle: 'italic' }}>{props.payload.text}</Text>
    )
  }
  return (
    // <TouchableOpacity
    //   activeOpacity={0.8}
    //   onPress={() => {
    //     navigation.navigate('WebPage', {
    //       title: props.name + '的动态',
    //       url: `https://m.bilibili.com/dynamic/${props.commentId}`,
    //     })
    //   }}>
    <View style={[styles.textContainer]}>
      <RichText
        imageSize={16}
        text={props.text}
        textProps={{
          style: {
            fontSize: 16,
            color: props.top ? '#00699D' : 'black',
            lineHeight: 24,
          },
        }}
      />
      <View style={styles.forwardContainer}>
        <View style={styles.forwardContent}>{forwardContent}</View>
      </View>
    </View>
    // </TouchableOpacity>
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
    padding: 12,
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
