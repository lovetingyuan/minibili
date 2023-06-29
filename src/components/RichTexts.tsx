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
import { parseUrl } from '../utils'

export default React.memo(
  function RichTexts(props: {
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
    let key = 0
    const fontSize = props.fontSize || 16
    const Topic = props.topic ? (
      <View style={styles.topicContainer}>
        <Icon name="hashtag" type="fontisto" color="#178bcf" size={14} />
        <Text
          onPress={() => {
            if (props.topic?.jump_url) {
              navigation.navigate('WebPage', {
                title: '话题：' + props.topic?.name,
                url: parseUrl(props.topic?.jump_url),
              })
              // Linking.openURL(url.startsWith('//') ? 'https:' + url : url)
            }
          }}
          style={[styles.link, { fontSize }]}>
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
            {'🔗' + node.text + ' '}
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
            style={[styles.link, { fontSize }]}>
            {node.text}
          </Text>,
        )
      } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_EMOJI) {
        reactNodes.push(
          <Image
            key={key++}
            source={{ uri: node.emoji.icon_url }}
            style={[styles.emoji]}
          />,
        )
      } else if (node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_TOPIC) {
        reactNodes.push(
          <Text
            onPress={() => {
              Linking.openURL(parseUrl(node.jump_url))
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
              Linking.openURL(parseUrl(node.jump_url))
            }}
            key={key++}
            style={[styles.link, { fontSize }]}>
            {'📺 ' + node.text}
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
            {'🛒 ' + node.text}
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
            {'📧 ' + node.text}
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
            {'🗳️ ' + node.text}
          </Text>,
        )
      } else if (
        node.type === HandledRichTextType.RICH_TEXT_NODE_TYPE_LOTTERY
      ) {
        reactNodes.push(
          <Text
            key={key++}
            style={[styles.link, { fontSize }]}
            onPress={() => {
              Linking.openURL(
                `https://t.bilibili.com/lottery/h5/index/#/result?business_type=1&business_id=${props.idStr}&isWeb=1`,
              )
            }}>
            {'🎁 ' + node.text}
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
            {'📹 ' + node.text}
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
            style={[styles.link, { fontSize }]}>
            {'📝 ' + node.text}
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
      <View style={[props.style]}>
        {Topic}
        <Text
          style={styles.textContainer}
          {...props.textProps}
          onTextLayout={evt => {
            setLines(evt.nativeEvent.lines.length)
          }}>
          {reactNodes}
          <Text style={styles.hackText}>{reactNodes.length ? '\n ' : ''}</Text>
        </Text>
        {typeof props.textProps?.numberOfLines === 'number' &&
          lines - 1 > props.textProps.numberOfLines && (
            <Text style={styles.hackText}>
              {reactNodes.length ? '\n ' : ''}
            </Text>
          )}
      </View>
    )
  },
  (a, b) => {
    return a.idStr === b.idStr
  },
)

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
    marginBottom: 10,
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
  },
  hackText: { fontSize: 8 },
})
