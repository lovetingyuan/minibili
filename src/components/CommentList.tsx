import { Icon } from '@rneui/themed'
import React from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useDynamicComments } from '../api/dynamic-comments'
import Comment from './Comment'

const CommentList: React.FC<{
  commentId: string | number
  commentType: number
  upName: string
  dividerRight?: React.ReactNode
}> = props => {
  const {
    data: { replies: comments, allCount },
    isLoading: commentLoading,
    error: commentError,
  } = useDynamicComments(props.commentId, props.commentType)

  return (
    <View>
      <View style={styles.divider}>
        <View style={styles.commentCountContainer}>
          <Icon
            name="comment-text-outline"
            type="material-community"
            size={15}
            color="#555"
          />
          <Text style={styles.commentCount}>{allCount || 0}条评论</Text>
        </View>
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
    marginVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentCountContainer: { flexDirection: 'row', alignItems: 'center' },
  commentCount: {
    color: '#555',
    fontSize: 13,
    marginRight: 12,
    paddingHorizontal: 8,
  },
  right: {
    paddingHorizontal: 8,
  },
})

export default CommentList
