import React from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { ReplyItem, useDynamicComments } from '../../api/dynamic-comments'
import Comment from '../../components/Comment'

export default function CommentList(props: {
  commentId: string | number
  commentType: number
  upName: string
}) {
  const [comments, setComments] = React.useState<ReplyItem[] | null>(null)
  const {
    data: replies,
    isLoading: commentLoading,
    error: commentError,
  } = useDynamicComments(props.commentId, props.commentType)
  if (comments !== replies) {
    setComments(replies)
  }
  return (
    <View>
      {commentError ? (
        <View>
          <Text style={styles.commentTipText}>评论加载失败</Text>
        </View>
      ) : null}
      {commentLoading ? (
        <View>
          <Text style={styles.commentTipText}>评论加载中...</Text>
          <ActivityIndicator color="blue" animating />
        </View>
      ) : null}
      {comments?.length ? (
        comments.map((comment, i) => {
          return (
            <View
              key={comment.id}
              style={[
                styles.commentItemContainer,
                i ? null : { marginTop: 0 },
              ]}>
              <Comment upName={props.upName} comment={comment} />
            </View>
          )
        })
      ) : comments?.length === 0 && !commentLoading ? (
        <View>
          <Text style={styles.commentTipText}>暂无评论</Text>
        </View>
      ) : null}
      {comments?.length ? (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>只加载前40条</Text>
          <Text />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  commentItemContainer: {
    marginTop: 20,
    borderBottomColor: '#eee',
    borderBottomWidth: 0.5,
  },
  footerContainer: { marginVertical: 10, alignItems: 'center' },
  footerText: { color: '#aaa', fontSize: 12 },
  commentTipText: {
    textAlign: 'center',
    marginVertical: 50,
  },
})
