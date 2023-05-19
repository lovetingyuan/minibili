import React from 'react'
import { View, Text, Image, Linking, StyleSheet, ViewStyle } from 'react-native'
import { RichTextNode } from '../api/dynamic-items.schema'
import { HandledRichTextType } from '../api/dynamic-items.type'
import { reportUnknownRichTextItem } from '../utils/report'
import { Icon } from '@rneui/themed'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../types'

export default function RichTexts(props: {
  nodes?: RichTextNode[]
  topic?: {
    name: string
    jump_url: string
  } | null
  style?: ViewStyle
}) {
  const navigation = useNavigation<NavigationProps['navigation']>()
  const reactNodes: React.ReactNode[] = []
  if (!props.nodes) {
    return null
  }
  let key = 0
  for (const node of props.nodes) {
    if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_TEXT) {
      reactNodes.push(
        <Text style={styles.text} key={key++}>
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
          style={styles.link}>
          {' '}
          {node.text}{' '}
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
          style={styles.link}>
          {' '}
          {node.text}
        </Text>,
      )
    } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_EMOJI) {
      reactNodes.push(
        <Image
          key={key++}
          source={{ uri: node.emoji.icon_url }}
          style={styles.emoji}
        />,
      )
    } else {
      reportUnknownRichTextItem(node)
      reactNodes.push(
        <Text style={styles.text} key={key++}>
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
              props.topic?.jump_url && Linking.openURL(props.topic?.jump_url)
            }}
            style={[styles.link]}>
            {props.topic.name}
          </Text>
        </View>
      ) : null}
      <Text style={styles.textContainer}>{reactNodes}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  topicContainer: { flexDirection: 'row', alignItems: 'center' },
  emoji: {
    width: 20,
    height: 20,
    marginHorizontal: 2,
  },
  link: {
    color: '#178bcf',
    fontSize: 15,
  },
  text: {
    lineHeight: 24,
    fontSize: 15,
    borderWidth: 0.5,
  },
})
