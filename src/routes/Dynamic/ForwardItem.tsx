import React from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import {
  HandledDynamicTypeEnum,
  HandledForwardTypeEnum,
} from '../../api/dynamic-items.type'
import { Avatar, Text, useTheme } from '@rneui/themed'
import RichTexts from '../../components/RichTexts'
import { NavigationProps } from '../../types'
import { useNavigation } from '@react-navigation/native'
import useIsDark from '../../hooks/useIsDark'
import store from '../../store'
import { Image } from 'expo-image'
import { CommonContent } from './CommonItem'
import { Additional } from '../../components/Additional'

export default function ForwardItem(
  props: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD>,
) {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const isDark = useIsDark()
  const { theme } = useTheme()

  let forwardContent = (
    <Text style={{ fontStyle: 'italic' }}>{props.payload.text}</Text>
  )
  const forwardRichTextContent = (
    <RichTexts
      idStr={props.payload.id}
      nodes={props.payload.desc?.rich_text_nodes}
      style={{ marginBottom: 10 }}
      topic={props.payload.topic}
      textProps={{ numberOfLines: 3 }}
    />
  )
  if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_AV) {
    const { title, cover, stat } = props.payload.video
    forwardContent = (
      <View style={{ flexDirection: 'column', flex: 1 }}>
        {forwardRichTextContent}
        <View style={{ flexDirection: 'row' }}>
          <Image
            style={styles.forwardContentImage}
            source={{ uri: cover + '@240w_240h_1c.webp' }}
          />
          <View style={{ flex: 6 }}>
            <Text numberOfLines={2} style={{ lineHeight: 20, fontSize: 15 }}>
              <Text style={{ fontWeight: 'bold' }}>视频：</Text>
              {title}
            </Text>
            <Text style={{ marginTop: 10, fontSize: 13 }}>
              {stat.play}播放{'  '}
              {stat.danmaku}弹幕
            </Text>
          </View>
        </View>
      </View>
    )
  } else if (
    props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_DRAW ||
    props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_WORD
  ) {
    forwardContent = (
      <View style={{ flexDirection: 'column', flex: 1 }}>
        {forwardRichTextContent}
        <View style={styles.imagesContainer}>
          {props.payload.images.map((img, i) => {
            return (
              <Image
                style={[styles.image, { aspectRatio: img.ratio }]}
                key={img.src + i}
                source={{ uri: img.src + '@240w_240h_1c.webp' }}
              />
            )
          })}
        </View>
        <Additional additional={props.payload.additional} />
      </View>
    )
  } else if (
    props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_PGC ||
    props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_COMMON_SQUARE ||
    props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_ARTICLE ||
    props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_MUSIC ||
    props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_LIVE ||
    props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_MEDIALIST ||
    props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_COURSES_SEASON ||
    props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_LIVE_RCMD
  ) {
    forwardContent = (
      <View style={{ gap: 10, flexShrink: 1 }}>
        {forwardRichTextContent}
        <CommonContent
          type={props.payload.type}
          title={props.payload.title}
          url={'url' in props.payload ? props.payload.url : ''}
          text={props.payload.text || ''}
          cover={props.payload.cover}
          forward
        />
      </View>
    )
  }
  return (
    <View style={[styles.textContainer]}>
      <RichTexts
        idStr={props.payload.id}
        nodes={props.desc?.rich_text_nodes}
        style={{ marginBottom: 10 }}
        topic={props.topic}
        textProps={{ numberOfLines: 3 }}
      />
      <View
        style={[
          styles.forwardContainer,
          { backgroundColor: isDark ? '#222' : '#dedede' },
        ]}>
        {props.payload.name && props.payload.mid !== props.mid ? (
          <Pressable
            style={styles.forwardUp}
            onPress={() => {
              navigation.push('Dynamic', {
                user: {
                  face: props.payload.face,
                  name: props.payload.name,
                  mid: props.payload.mid,
                  sign: '-',
                },
              })
            }}>
            {props.payload.face ? (
              <Avatar
                source={{ uri: props.payload.face + '@50w_50h_1c.webp' }}
                size={22}
                rounded
              />
            ) : null}
            <Text
              style={[styles.forwardUpName, { color: theme.colors.primary }]}>
              {props.payload.name}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          style={styles.forwardContent}
          onPress={() => {
            if (props.payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_AV) {
              const { video } = props.payload
              store.currentVideo = {
                bvid: video.bvid,
                name: props.payload.name,
                face: props.payload.face,
                mid: props.payload.mid,
                // pubDate: props.payload.
                title: video.title,
                aid: video.aid,
                cover: video.cover,
                desc: video.desc,
              }
              navigation.push('Play', {
                from: {
                  mid: props.mid,
                },
              })
            } else {
              navigation.navigate('WebPage', {
                title: props.payload.name + '的动态',
                url: `https://m.bilibili.com/dynamic/${props.payload.id}`,
              })
            }
          }}>
          {forwardContent}
        </Pressable>
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
    padding: 10,
    borderRadius: 4,
    overflow: 'hidden',
  },
  forwardUp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  forwardUpName: { fontSize: 15, marginLeft: 8 },
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
  imagesContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
    gap: 10,
  },
})
