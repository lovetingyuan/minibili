import { useNavigation } from '@react-navigation/native'
import { Icon, Text } from '@rn-vui/themed'
import React from 'react'
import {
  Image,
  Linking,
  type TextProps,
  View,
  type ViewStyle,
} from 'react-native'

import { colors } from '@/constants/colors.tw'

import type { RichTextNode } from '../api/dynamic-items.schema'
import { HandledRichTextType } from '../api/dynamic-items.type'
import { useStore } from '../store'
import type { NavigationProps } from '../types'
import { parseImgUrl, parseUrl } from '../utils'

function RichTexts(props: {
  idStr: string | number | null
  nodes?: RichTextNode[]
  topic?: {
    name: string
    jump_url: string
  } | null
  style?: ViewStyle
  textProps?: TextProps
  fontSize?: number
}) {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const reactNodes: React.ReactNode[] = []
  const { setImagesList } = useStore()
  let key = 0
  const fontSize = props.fontSize || 16
  const Topic = props.topic ? (
    <View className="mb-3 flex-row items-center">
      <Icon
        name="hashtag"
        type="fontisto"
        color={tw(colors.primary.text).color}
        size={14}
      />
      <Text
        onPress={() => {
          if (props.topic?.jump_url) {
            navigation.navigate('WebPage', {
              title: `话题：${props.topic?.name}`,
              url: parseUrl(props.topic?.jump_url),
            })
          }
        }}
        className={colors.primary.text}
        style={{ fontSize }}>
        {' '}
        {props.topic.name}
      </Text>
    </View>
  ) : null
  const [lines, setLines] = React.useState(0)
  if (!props.nodes) {
    return Topic
  }

  for (const node of props.nodes) {
    if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_TEXT) {
      reactNodes.push(
        <Text style={{ fontSize, lineHeight: fontSize * 1.6 }} key={key++}>
          {node.text}
        </Text>,
      )
    } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_WEB) {
      reactNodes.push(
        <Text
          onPress={() => {
            Linking.openURL(node.jump_url)
          }}
          key={key++}
          className={colors.primary.text}
          style={{ fontSize }}>
          {`🔗${node.text} `}
        </Text>,
      )
    } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_AT) {
      reactNodes.push(
        <Text
          key={key++}
          onPress={() => {
            navigation.push('Dynamic', {
              user: {
                face: '',
                name: node.text.substring(1),
                mid: node.rid,
                sign: '-',
              },
            })
          }}
          className={colors.primary.text}
          style={{ fontSize }}>
          {node.text}
        </Text>,
      )
    } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_EMOJI) {
      reactNodes.push(
        <Image
          key={key++}
          source={{ uri: parseImgUrl(node.emoji.icon_url) }}
          className="h-5 w-5"
        />,
      )
    } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_TOPIC) {
      reactNodes.push(
        <Text
          onPress={() => {
            Linking.openURL(parseUrl(node.jump_url))
          }}
          key={key++}
          className={colors.primary.text}
          style={{ fontSize }}>
          {node.text}
        </Text>,
      )
    } else if (
      node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_BV ||
      node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_AV ||
      node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_OGV_EP
    ) {
      reactNodes.push(
        <Text
          numberOfLines={1}
          onPress={() => {
            if (node.rid.startsWith('BV')) {
              navigation.push('Play', {
                bvid: node.rid,
                title: node.text,
              })
            } else {
              Linking.openURL(parseUrl(node.jump_url))
            }
          }}
          key={key++}
          className={colors.primary.text}
          style={{ fontSize }}>
          {`📺 ${node.text}`}
        </Text>,
      )
    } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_GOODS) {
      reactNodes.push(
        <Text
          numberOfLines={1}
          onPress={() => {
            Linking.openURL(node.jump_url)
          }}
          key={key++}
          className={colors.primary.text}
          style={{ fontSize }}>
          {`🛒 ${node.text}`}
        </Text>,
      )
    } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_MAIL) {
      reactNodes.push(
        <Text
          onPress={() => {
            Linking.openURL(`mailto:${node.text}`)
          }}
          key={key++}
          className={colors.primary.text}
          style={{ fontSize }}>
          {`📧 ${node.text}`}
        </Text>,
      )
    } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_VOTE) {
      reactNodes.push(
        <Text
          onPress={() => {
            Linking.openURL(
              `https://t.bilibili.com/vote/h5/index/#/result?vote_id=${node.rid}`,
            )
          }}
          key={key++}
          className={colors.primary.text}
          style={{ fontSize }}>
          {`🗳️ ${node.text}`}
        </Text>,
      )
    } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_LOTTERY) {
      reactNodes.push(
        <Text
          key={key++}
          className={colors.primary.text}
          style={{ fontSize }}
          onPress={() => {
            Linking.openURL(
              `https://t.bilibili.com/lottery/h5/index/#/result?business_type=1&business_id=${props.idStr}&isWeb=1`,
            )
          }}>
          {`🎁 ${node.text}`}
        </Text>,
      )
    } else if (
      node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_OGV_SEASON
    ) {
      reactNodes.push(
        <Text
          onPress={() => {
            Linking.openURL(node.jump_url)
          }}
          numberOfLines={1}
          key={key++}
          className={colors.primary.text}
          style={{ fontSize }}>
          {`📹 ${node.text}`}
        </Text>,
      )
    } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_CV) {
      reactNodes.push(
        <Text
          numberOfLines={1}
          onPress={() => {
            Linking.openURL(parseUrl(node.jump_url))
          }}
          key={key++}
          className={colors.primary.text}
          style={{ fontSize }}>
          {`📝 ${node.text}`}
        </Text>,
      )
    } else if (
      node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_VIEW_PICTURE
    ) {
      reactNodes.push(
        <Text
          numberOfLines={1}
          onPress={() => {
            // Linking.openURL(parseUrl(node.jump_url))
            setImagesList(node.pics)
          }}
          key={key++}
          className={colors.primary.text}
          style={{ fontSize }}>
          {`📝 ${node.text}`}
        </Text>,
      )
    } else {
      reactNodes.push(
        <Text style={{ fontSize, lineHeight: fontSize * 1.6 }} key={key++}>
          {node.text}
        </Text>,
      )
    }
  }
  const textOverflow =
    typeof props.textProps?.numberOfLines === 'number' &&
    lines - 1 > props.textProps.numberOfLines
  return (
    <View
      className={`flex-1 ${textOverflow ? 'mb-4' : 'mb-3'}`}
      style={props.style}>
      {Topic}
      <Text
        className="flex-1 flex-row flex-wrap items-center"
        {...props.textProps}
        onTextLayout={(evt) => {
          setLines(evt.nativeEvent.lines.length)
        }}>
        {reactNodes}
        <Text className="text-[4px]">{reactNodes.length ? '\n ' : ''}</Text>
      </Text>
    </View>
  )
}

export default React.memo(RichTexts, (a, b) => {
  return a.idStr === b.idStr
})
