import { Divider } from '@rneui/base'
import React from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { ReplyItem, useDynamicComments } from '../api/dynamic-comments'
import Comment from './Comment'

const CommentList: React.FC<{
  commentId: string | number
  commentType: number
  upName: string
  dividerRight?: React.ReactNode
}> = props => {
  const [comments, setComments] = React.useState<ReplyItem[] | null>(null)
  const {
    data: { replies, allCount },
    isLoading: commentLoading,
    error: commentError,
  } = useDynamicComments(props.commentId, props.commentType)
  if (comments !== replies) {
    setComments(replies)
  }
  return (
    <View>
      <View style={styles.divider}>
        <Divider />
        <Text style={styles.commentCount}>{allCount || 0}条评论</Text>
        <View style={styles.right}>{props.dividerRight}</View>
      </View>
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
        comments.map(comment => {
          return (
            <View key={comment.id} style={{ marginBottom: 10 }}>
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
  footerContainer: { marginBottom: 10, alignItems: 'center' },
  footerText: { color: '#888', fontSize: 12 },
  commentTipText: {
    textAlign: 'center',
    marginVertical: 50,
  },
  divider: {
    position: 'relative',
    // marginVertical: 30,
    marginTop: 15,
    marginBottom: 20,
  },
  commentCount: {
    color: '#666',
    fontSize: 12,
    marginRight: 12,
    position: 'absolute',
    left: 10,
    top: -7,
    zIndex: 1,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
  },
  right: {
    position: 'absolute',
    right: 10,
    top: -8,
    zIndex: 1,
    paddingHorizontal: 8,
    backgroundColor: '#f2f2f2',
  },
})

export default CommentList
