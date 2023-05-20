import React from 'react'
import { Linking, StyleSheet, Text, View, Image } from 'react-native'
import { MessageContent, ReplyItem } from '../api/comments'

interface Props {
  upName: string
  comment: ReplyItem
}

function CommentText(props: { nodes: MessageContent }) {
  const { nodes } = props
  return (
    <Text style={{ fontSize: 15 }}>
      {nodes.map((node, i) => {
        if (node.type === 'at') {
          return (
            <Text
              key={i}
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
              key={i}
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
            <Image key={i} source={{ uri: node.url }} style={styles.emoji} />
          )
        }
        if (node.type === 'av') {
          return (
            <Text
              key={i}
              style={styles.link}
              onPress={() => {
                Linking.openURL(node.url)
              }}>
              ▶{node.text}
            </Text>
          )
        }
        return <Text key={i}>{node.text}</Text>
      })}
    </Text>
  )
}

export default function Comment(props: Props) {
  const { comment, upName } = props
  const upStyle = (name: string) => {
    return upName === name
      ? styles.pinkName
      : {
          color: 'black',
        }
  }

  return (
    <View>
      <Text
        style={[
          styles.commentContent,
          comment.upLike ? styles.upLike : null,
          comment.top ? styles.top : null,
        ]}>
        <Text style={[styles.commentName, upStyle(comment.name)]}>
          【{comment.name}】
          {comment.sex === '男' ? (
            '♂'
          ) : comment.sex === '女' ? (
            <Text style={styles.pinkName}>♀</Text>
          ) : (
            ''
          )}
          :{' '}
        </Text>
        <CommentText nodes={comment.message} />
        {comment.like ? (
          <Text style={styles.likeNum}> {comment.like}</Text>
        ) : null}
      </Text>
      {comment.replies ? (
        <View style={styles.reply}>
          {comment.replies.map(reply => {
            return (
              <Text key={reply.id} style={styles.replyItem}>
                <Text style={[styles.replyName, upStyle(reply.name)]}>
                  {reply.name}:{' '}
                </Text>
                <CommentText nodes={reply.message} />
                {reply.like ? (
                  <Text style={styles.likeNum}> {reply.like}</Text>
                ) : null}
              </Text>
            )
          })}
        </View>
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
  commentContent: {
    fontSize: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    lineHeight: 24,
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
    marginLeft: 10,
    marginTop: 8,
    opacity: 0.75,
    flex: 1,
  },
  replyItem: {
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    lineHeight: 20,
  },
  replyName: {
    fontWeight: 'bold',
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
