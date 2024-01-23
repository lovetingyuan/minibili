import React from 'react'
import { View, Pressable, TouchableOpacity } from 'react-native'
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
// import { s } from '../../styles'
import { imgUrl } from '../../utils'

export default function ForwardItem(props: {
  item: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD>
}) {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const { theme } = useTheme()
  const { item } = props
  const { payload } = item

  let forwardContent = <Text className="italic">{payload.text}</Text>
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
      <View className="flex-col flex-1">
        {forwardRichTextContent}
        <View className="flex-row">
          <Image
            className="w-30 aspect-[8/5] mr-3 rounded"
            source={{ uri: imgUrl(cover, 240, 150) }}
          />
          <View className="grow-[6]">
            <Text numberOfLines={2} className="text-base">
              <Text className="font-bold">视频：</Text>
              {title}
            </Text>
            <Text className="mt-3 text-sm">
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
      <View className="flex-1 flex-col">
        {forwardRichTextContent}
        <View className="flex-row overflow-hidden gap-1">
          {payload.images.map((img, i) => {
            return (
              <Image
                className="h-18 my-3 rounded"
                style={{ aspectRatio: img.ratio }}
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
      <View className="shrink">
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
      className="flex-1"
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
        className="flex-1 mb-2 rounded p-3 overflow-hidden"
        style={{ backgroundColor: theme.colors.grey5 }}>
        {payload.name && payload.mid !== item.mid ? (
          <Pressable
            className="flex-row items-center mb-2"
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
              className="text-base ml-2"
              style={{ color: theme.colors.primary }}>
              {payload.name}
            </Text>
          </Pressable>
        ) : null}
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-1 flex-row"
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
