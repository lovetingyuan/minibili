import React from 'react'
import {
  Linking,
  StyleSheet,
  View,
  Image,
  TextStyle,
  TouchableOpacity,
} from 'react-native'
import { MessageContent, ReplyItem } from '../api/comments'
import { Text, useTheme } from '@rneui/themed'
import useIsDark from '../hooks/useIsDark'
import { useNavigation } from '@react-navigation/native'
import { NavigationProps } from '../types'

interface Props {
  upName: string
  comment: ReplyItem
}

function CommentText(props: {
  nodes: MessageContent
  style?: TextStyle | TextStyle[]
  idStr: string
}) {
  const { nodes, style, idStr } = props
  return (
    <Text style={style} selectable>
      {nodes.map((node, i) => {
        if (node.type === 'at') {
          return (
            <Text
              key={idStr + i}
              style={styles.link}
              onPress={() => {
                Linking.openURL('https://m.bilibili.com/space/' + node.mid)
              }}>
              {node.text}
            </Text>
          )
        }
        if (node.type === 'url') {
          return (
            <Text
              key={idStr + i}
              style={styles.link}
              onPress={() => {
                Linking.openURL(node.url)
              }}>
              {node.url}
            </Text>
          )
        }
        if (node.type === 'emoji') {
          return (
            <Image
              key={idStr + i}
              source={{ uri: node.url }}
              style={styles.emoji}
            />
          )
        }
        if (node.type === 'av') {
          return (
            <Text
              key={idStr + i}
              style={styles.link}
              onPress={() => {
                Linking.openURL(node.url)
              }}>
              ▶{node.text}
            </Text>
          )
        }
        return (
          <Text selectable key={idStr + i}>
            {node.text}
          </Text>
        )
      })}
    </Text>
  )
}

export default function Comment(props: Props) {
  const { comment, upName } = props
  const { theme } = useTheme()
  const dark = useIsDark()
  const upStyle = (name: string) => {
    return upName === name
      ? styles.pinkName
      : {
          color: theme.colors.primary,
        }
  }
  const navigation = useNavigation<NavigationProps['navigation']>()

  return (
    <View>
      <Text style={[styles.commentContent]}>
        <Text style={[styles.commentName]}>
          <Text
            style={upStyle(comment.name)}
            onPress={() => {
              Linking.openURL('https://m.bilibili.com/space/' + comment.mid)
            }}>
            {comment.name}
          </Text>
          <Text style={comment.sex === '女' ? styles.pinkName : null}>
            {comment.sex === '男' ? '♂' : comment.sex === '女' ? '♀' : ''}
          </Text>
          ：
        </Text>
        <CommentText
          nodes={comment.message}
          style={[
            styles.commentText,
            comment.upLike ? styles.upLike : {},
            comment.top ? styles.top : {},
          ]}
          idStr={comment.id + '_'}
        />
        {comment.like ? (
          <Text style={styles.likeNum}> {comment.like}</Text>
        ) : null}
      </Text>
      {comment.replies?.length ? (
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.reply,
            {
              backgroundColor: dark ? '#333' : '#ddd',
            },
          ]}
          onPress={() => {
            const root = comment.replies[0].root
            navigation.navigate('WebPage', {
              title: '评论详情',
              url: `https://www.bilibili.com/h5/comment/sub?oid=${comment.oid}&pageType=1&root=${root}`,
            })
          }}>
          {comment.replies.map(reply => {
            return (
              <Text key={reply.id + '#'} style={styles.replyItem}>
                <Text
                  style={[styles.replyName, upStyle(reply.name)]}
                  onPress={() => {
                    Linking.openURL('https://m.bilibili.com/space/' + reply.mid)
                  }}>
                  {reply.name}：
                </Text>
                <CommentText nodes={reply.message} idStr={reply.id + '_'} />
                {reply.like ? (
                  <Text style={styles.likeNum}> {reply.like}</Text>
                ) : null}
              </Text>
            )
          })}
          {comment.rcount > 3 ? (
            <Text style={{ color: theme.colors.primary }}>
              {comment.moreText ? comment.moreText + '...' : '...'}
            </Text>
          ) : null}
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  comment: {
    marginTop: 20,
    marginBottom: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentText: { fontSize: 16, lineHeight: 23 },
  commentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  commentName: {
    fontWeight: 'bold',
    fontSize: 16,
    verticalAlign: 'middle',
  },
  top: {
    color: '#00699D',
    fontWeight: 'bold',
  },
  upLike: {
    color: '#4f7d00',
    fontWeight: 'bold',
  },
  reply: {
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
    marginBottom: 15,
    gap: 5,
    opacity: 0.9,
    flex: 1,
  },
  replyItem: {
    // marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    lineHeight: 20,
    fontSize: 15,
  },
  replyName: {
    // fontWeight: 'bold',
  },
  likeNum: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#fa5a57',
  },
  topImg: {
    width: 24,
    height: 12,
  },
  link: {
    color: '#008AC5',
  },
  emoji: {
    width: 18,
    height: 18,
  },
  pinkName: {
    color: '#FF6699',
  },
})
