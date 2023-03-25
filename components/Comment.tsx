import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { ReplyItem } from '../services/api/video-comments'
import RichText from './RichText'

interface Props {
  upName: string
  comment: ReplyItem
}

export default function Comment(props: Props) {
  const { comment, upName } = props
  const upStyle = (name: string) => {
    return upName === name
      ? {
          color: '#FF6699',
        }
      : {
          color: 'black',
        }
  }

  return (
    <>
      <Text
        style={[
          styles.commentContent,
          comment.upLike ? styles.upLike : null,
          comment.top ? styles.top : null,
        ]}>
        <Text style={[styles.commentName, upStyle(comment.name)]}>
          {comment.name}:{' '}
        </Text>
        <RichText text={comment.message} imageSize={18} />
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
                <RichText text={reply.message} imageSize={15} />
                {reply.like ? (
                  <Text style={styles.likeText}> {reply.like}</Text>
                ) : null}
              </Text>
            )
          })}
        </View>
      ) : null}
    </>
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
  likeText: {
    fontSize: 12,
    color: '#fa5a57',
  },
})
