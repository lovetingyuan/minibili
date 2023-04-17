import React from 'react'
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  // Linking,
} from 'react-native'
import RichText from '../../components/RichText'
import {
  DynamicItemType,
  DynamicMajorTypeEnum,
  DynamicTypeEnum,
} from '../../api/dynamic-items'
import DynamicStat from './DynamicStat'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../../types'

export default function ForwardItem(
  props: DynamicItemType<DynamicTypeEnum.DYNAMIC_TYPE_FORWARD>,
) {
  const navigation = useNavigation<NavigationProps['navigation']>()
  let forwardContent = <Text>暂不支持显示</Text>
  if (props.payload.type === DynamicMajorTypeEnum.MAJOR_TYPE_ARCHIVE) {
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
  } else if (props.payload.type === DynamicMajorTypeEnum.MAJOR_TYPE_DRAW) {
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
        {props.payload.text2 ? <Text>{props.payload.text2}</Text> : null}
      </View>
    )
  } else if (props.payload.type === DynamicMajorTypeEnum.MAJOR_TYPE_ARTICLE) {
    forwardContent = (
      <View>
        <Text style={{ fontSize: 15, marginBottom: 10 }}>
          {props.payload.title}
        </Text>
        <Text
          numberOfLines={3}
          style={{ backgroundColor: '#dedede', padding: 6 }}>
          {props.payload.text}
        </Text>
      </View>
    )
  } else if (props.payload.type === DynamicMajorTypeEnum.MAJOR_TYPE_WORD) {
    forwardContent = <Text>{props.payload.text}</Text>
  } else if (props.payload.type === DynamicMajorTypeEnum.MAJOR_TYPE_LIVE) {
    forwardContent = (
      <View>
        <Text>{props.payload.title}</Text>
        <Image
          source={{ uri: props.payload.cover }}
          style={{ width: 100, height: 50, marginTop: 5, borderRadius: 4 }}
        />
      </View>
    )
  } else if (props.payload.type === DynamicMajorTypeEnum.MAJOR_TYPE_NONE) {
    forwardContent = <Text>{props.payload.text}</Text>
  }
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        navigation.navigate('WebPage', {
          url: `https://m.bilibili.com/dynamic/${props.commentId}`,
        })
        // Linking.openURL(`https://m.bilibili.com/dynamic/${props.commentId}`)
      }}>
      <View style={[styles.textContainer]}>
        <RichText
          imageSize={16}
          text={props.text}
          textProps={{
            style: { fontSize: 16, color: props.top ? '#00699D' : 'black' },
          }}
        />
        <View style={styles.forwardContainer}>
          <View style={styles.forwardContent}>{forwardContent}</View>
        </View>
        <DynamicStat
          name={props.name}
          id={props.id}
          title={props.text || '-'}
          date={props.date}
          like={props.likeCount}
          share={props.forwardCount}
        />
      </View>
    </TouchableOpacity>
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
  },
  textContainer: {
    flex: 1,
  },
  forwardContainer: {
    flex: 1,
    marginLeft: 8,
    marginBottom: 8,
    marginTop: 16,
    paddingLeft: 8,
    borderLeftWidth: 0.5,
    borderLeftColor: '#bbb',
    opacity: 0.7,
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
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  date: { color: '#555', fontSize: 12 },
  imagesContainer: {},
})
