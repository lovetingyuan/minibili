import { useNavigation } from '@react-navigation/native'
import { Avatar, Text } from '@rneui/themed'
import { Image } from 'expo-image'
import React from 'react'
import { Pressable, TouchableOpacity, View } from 'react-native'

import { colors } from '@/constants/colors.tw'

import type { DynamicItemType } from '../../api/dynamic-items'
import {
  type HandledDynamicTypeEnum,
  HandledForwardTypeEnum,
} from '../../api/dynamic-items.type'
import { Additional } from '../../components/Additional'
import RichTexts from '../../components/RichTexts'
import type { NavigationProps } from '../../types'
import { parseImgUrl } from '../../utils'
import { CommonContent } from './CommonItem'

export default function ForwardItem(props: {
  item: DynamicItemType<HandledDynamicTypeEnum.DYNAMIC_TYPE_FORWARD>
}) {
  const navigation = useNavigation<NavigationProps['navigation']>()
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
    if (typeof payload.video === 'string') {
      forwardContent = (
        <View className="flex-1 flex-col">
          <Text className="font-bold">视频：</Text>
          <Text>{payload.video}</Text>
        </View>
      )
    } else {
      const { title, cover, stat } = payload.video
      forwardContent = (
        <View className="flex-1 flex-col">
          {forwardRichTextContent}
          <View className="flex-row">
            <Image
              className="mr-3 aspect-[8/5] h-auto w-[45%] rounded"
              source={{ uri: parseImgUrl(cover, 240, 150) }}
            />
            <View className="flex-1">
              <Text numberOfLines={3} className="text-sm">
                <Text className="font-bold">视频：</Text>
                {title}
              </Text>
              <Text className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                {stat.play}播放{'   '}
                {stat.danmaku}弹幕
              </Text>
            </View>
          </View>
        </View>
      )
    }
  } else if (
    payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_DRAW ||
    payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_WORD
  ) {
    forwardContent = (
      <View className="flex-1 flex-col">
        {forwardRichTextContent}
        <View className="flex-row gap-2 overflow-hidden">
          {payload.images.map((img, i) => {
            return (
              <Image
                className="mt-2 h-24 w-auto rounded"
                style={{ aspectRatio: img.ratio }}
                key={img.src + i}
                source={{ uri: parseImgUrl(img.src, 240) }}
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
      <View className="flex-1">
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
          title: `${item.name}的动态`,
          url: `https://m.bilibili.com/dynamic/${item.id}`,
        })
      }}>
      <RichTexts
        idStr={payload.id}
        nodes={item.desc?.rich_text_nodes}
        topic={item.topic}
        textProps={{ numberOfLines: 3 }}
      />
      <View className="mb-2 flex-1 overflow-hidden rounded bg-stone-200 p-3 dark:bg-stone-900">
        {payload.name && payload.mid !== item.mid ? (
          <Pressable
            className="mb-2 flex-row items-center"
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
                source={{ uri: parseImgUrl(payload.face, 50) }}
                size={22}
                ImageComponent={Image}
                rounded
              />
            ) : null}
            <Text className={`ml-2 text-base ${colors.primary.text}`}>
              {payload.name}
            </Text>
          </Pressable>
        ) : null}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (payload.type === HandledForwardTypeEnum.DYNAMIC_TYPE_AV) {
              const { video } = payload
              if (typeof video === 'string') {
                // 一般是视频失效了
                return
              }
              navigation.push('Play', {
                bvid: video.bvid,
                name: payload.name,
                face: payload.face,
                mid: payload.mid,
                aid: video.aid,
                cover: video.cover,
                title: video.title,
                desc: video.desc,
              })
            } else {
              navigation.navigate('WebPage', {
                title: `${payload.name}的动态`,
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
