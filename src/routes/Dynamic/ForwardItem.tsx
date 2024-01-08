import React from 'react'
import { StyleSheet, View, Pressable, TouchableOpacity } from 'react-native'
import { DynamicItemType } from '../../api/dynamic-items'
import {
  HandledDynamicTypeEnum,
  HandledForwardTypeEnum,
} from '../../api/dynamic-items.type'
import { Avatar, Text, useTheme } from '@rneui/themed'
import RichTexts from '../../components/RichTexts'
import { NavigationProps } from '../../types'
import { useNavigation } from '@react-navigation/native'
import { Image } from 'expo-image'
import { CommonContent } from './CommonItem'
import { Additional } from '../../components/Additional'
import commonStyles from '../../styles'
import { imgUrl } from '../../utils'

export default function ForwardItem(props: {
  item: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD>
}) {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { theme } = useTheme()
  const { item } = props
  const { payload } = item

  let forwardContent = (
    <Text style={{ fontStyle: 'italic' }}>{payload.text}</Text>
  )
  const forwardRichTextContent = (
    <RichTexts
      idStr={payload.id}
      nodes={payload.desc?.rich_text_nodes}
      topic={payload.topic}
      fontSize={15}
      textProps={{ numberOfLines: 3 }}
    />
  )
  if (payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_AV) {
    const { title, cover, stat } = payload.video
    forwardContent = (
      <View style={{ flexDirection: 'column', flex: 1 }}>
        {forwardRichTextContent}
        <View style={{ flexDirection: 'row' }}>
          <Image
            style={styles.videoCover}
            source={{ uri: imgUrl(cover, 240, 150) }}
          />
          <View style={{ flex: 6 }}>
            <Text numberOfLines={2} style={{ lineHeight: 20, fontSize: 15 }}>
              <Text style={commonStyles.bold}>视频：</Text>
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
    payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_DRAW ||
    payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_WORD
  ) {
    forwardContent = (
      <View style={{ flexDirection: 'column', flex: 1 }}>
        {forwardRichTextContent}
        <View style={styles.imagesContainer}>
          {payload.images.map((img, i) => {
            return (
              <Image
                style={[styles.image, { aspectRatio: img.ratio }]}
                key={img.src + i}
                source={{ uri: imgUrl(img.src, 240) }}
              />
            )
          })}
        </View>
        <Additional additional={payload.additional} />
      </View>
    )
  } else if (
    payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_PGC ||
    payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_PGC_UNION ||
    payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_COMMON_SQUARE ||
    payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_ARTICLE ||
    payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_MUSIC ||
    payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_LIVE ||
    payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_MEDIALIST ||
    payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_COURSES_SEASON ||
    payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_LIVE_RCMD
  ) {
    forwardContent = (
      <View style={{ flexShrink: 1 }}>
        {forwardRichTextContent}
        <CommonContent
          type={payload.type}
          title={payload.title}
          url={'url' in payload ? payload.url : ''}
          text={payload.text || ''}
          cover={payload.cover}
          forward
        />
      </View>
    )
  }
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.textContainer}
      onPress={() => {
        navigation.navigate('WebPage', {
          title: item.name + '的动态',
          url: `https://m.bilibili.com/dynamic/${item.id}`,
        })
      }}>
      <RichTexts
        idStr={payload.id}
        nodes={item.desc?.rich_text_nodes}
        topic={item.topic}
        textProps={{ numberOfLines: 3 }}
      />
      <View
        style={[
          styles.forwardContainer,
          { backgroundColor: theme.colors.grey5 },
        ]}>
        {payload.name && payload.mid !== item.mid ? (
          <Pressable
            style={styles.forwardUp}
            onPress={() => {
              navigation.push('Dynamic', {
                user: {
                  face: payload.face,
                  name: payload.name,
                  mid: payload.mid,
                  sign: '-',
                },
              })
            }}>
            {payload.face ? (
              <Avatar
                source={{ uri: imgUrl(payload.face, 50) }}
                size={22}
                ImageComponent={Image}
                rounded
              />
            ) : null}
            <Text
              style={[styles.forwardUpName, { color: theme.colors.primary }]}>
              {payload.name}
            </Text>
          </Pressable>
        ) : null}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.forwardContent}
          onPress={() => {
            if (payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_AV) {
              const { video } = payload
              navigation.push('Play', {
                bvid: video.bvid,
                name: payload.name,
                face: payload.face,
                mid: payload.mid,
                aid: video.aid,
                cover: video.cover,
                // date: payload.date,
                // pubDate: payload.
                title: video.title,
                // aid: video.aid,
                // cover: video.cover,
                desc: video.desc,
                // play: video.stat.play,
              })
            } else {
              navigation.navigate('WebPage', {
                title: payload.name + '的动态',
                url: `https://m.bilibili.com/dynamic/${payload.id}`,
              })
            }
          }}>
          {forwardContent}
        </TouchableOpacity>
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
    height: 70,
    marginVertical: 10,
    borderRadius: 4,
  },
  textContainer: {
    flex: 1,
  },
  forwardContainer: {
    flex: 1,
    marginBottom: 8,
    // marginTop: 16,
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
  videoCover: {
    width: 120,
    // height: 70,
    height: undefined,
    aspectRatio: 1.6,
    marginRight: 10,
    // flex: 4,
    borderRadius: 4,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  imagesContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
    gap: 5,
  },
})
