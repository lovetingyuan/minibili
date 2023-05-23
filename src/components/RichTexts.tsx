import React from 'react'
import {
  View,
  Linking,
  StyleSheet,
  ViewStyle,
  TextProps,
  Image,
} from 'react-native'
import { RichTextNode } from '../api/dynamic-items.schema'
import { HandledRichTextType } from '../api/dynamic-items.type'
import { reportUnknownRichTextItem } from '../utils/report'
import { Icon, Text } from '@rneui/themed'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../types'
// import { Image } from 'expo-image'

export default function RichTexts(props: {
  idStr: string | null
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
  if (!props.nodes) {
    return null
  }
  let key = 0
  const fontSize = props.fontSize || 16

  for (const node of props.nodes) {
    if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_TEXT) {
      reactNodes.push(
        <Text style={[styles.text, { fontSize }]} key={key++}>
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
          style={[styles.link, { fontSize }]}>
          {' 🔗' + node.text + ' '}
        </Text>,
      )
    } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_AT) {
      reactNodes.push(
        <Text
          key={key++}
          onPress={() => {
            navigation.navigate('WebPage', {
              title: `${node.text.substring(1)}的主页`,
              url: `https://m.bilibili.com/space/${node.rid}`,
            })
          }}
          style={[styles.link, { fontSize }]}>
          {node.text}
        </Text>,
      )
    } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_EMOJI) {
      reactNodes.push(
        <Image
          key={key++}
          source={{ uri: node.emoji.icon_url }}
          style={[styles.emoji, { alignSelf: 'center' }]}
        />,
      )
    } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_TOPIC) {
      reactNodes.push(
        <Text
          onPress={() => {
            Linking.openURL(
              node.jump_url.startsWith('//')
                ? 'https:' + node.jump_url
                : node.jump_url,
            )
          }}
          key={key++}
          style={[styles.link, { fontSize }]}>
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
            Linking.openURL(
              node.jump_url.startsWith('//')
                ? 'https:' + node.jump_url
                : node.jump_url,
            )
          }}
          key={key++}
          style={[styles.link, { fontSize }]}>
          {' 视频：' + node.text}
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
          style={[styles.link, { fontSize }]}>
          {' 商品：' + node.text}
        </Text>,
      )
    } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_MAIL) {
      reactNodes.push(
        <Text
          onPress={() => {
            Linking.openURL(`mailto:${node.text}`)
          }}
          key={key++}
          style={[styles.link, { fontSize }]}>
          {node.text}
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
          style={[styles.link, { fontSize }]}>
          {' 投票：' + node.text}
        </Text>,
      )
    } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_LOTTERY) {
      reactNodes.push(
        <Text
          key={key++}
          style={[styles.link, { fontSize }]}
          onPress={() => {
            Linking.openURL(
              `https://t.bilibili.com/lottery/h5/index/#/result?business_type=1&business_id=${props.idStr}&isWeb=1`,
            )
          }}>
          {' 抽奖：' + node.text}
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
          style={[styles.link, { fontSize }]}>
          {' 剧集：' + node.text}
        </Text>,
      )
    } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_CV) {
      reactNodes.push(
        <Text
          numberOfLines={1}
          onPress={() => {
            Linking.openURL(
              node.jump_url.startsWith('//')
                ? 'https:' + node.jump_url
                : node.jump_url,
            )
          }}
          key={key++}
          style={[styles.link, { fontSize }]}>
          {' 文章：' + node.text}
        </Text>,
      )
    } else {
      reportUnknownRichTextItem(node)
      reactNodes.push(
        <Text style={[styles.text, { fontSize }]} key={key++}>
          {node.text}
        </Text>,
      )
    }
  }
  return (
    <View style={props.style}>
      {props.topic ? (
        <View style={styles.topicContainer}>
          <Icon name="tag" color="#178bcf" size={18} />
          <Text
            onPress={() => {
              const url = props.topic?.jump_url
              if (url) {
                Linking.openURL(url.startsWith('//') ? 'https:' + url : url)
              }
            }}
            style={[styles.link, { fontSize }]}>
            {props.topic.name}
          </Text>
        </View>
      ) : null}
      <Text style={styles.textContainer} {...props.textProps}>
        {reactNodes}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    flex: 1,
  },
  topicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    width: 20,
    height: 20,
  },
  link: {
    color: '#178bcf',
    fontSize: 15,
  },
  text: {
    lineHeight: 24,
    fontSize: 15,
    // borderWidth: 0.5,
  },
})
