import { Icon, Text, useTheme, Skeleton } from '@rneui/themed'
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useDynamicComments } from '../api/comments'
import Comment from './Comment'

const Loading = React.memo(() => {
  return (
    <View>
      {Array(10)
        .fill(0)
        .map((_, i) => {
          return (
            <View style={{ flex: 1, gap: 5, marginBottom: 20 }} key={i}>
              <Skeleton animation="pulse" width={'100%' as any} height={16} />
              {i % 2 ? (
                <Skeleton animation="pulse" width={'100%' as any} height={16} />
              ) : null}
              <Skeleton
                animation="pulse"
                width={(Math.random() * 100 + '%') as any}
                height={16}
              />
            </View>
          )
        })}
    </View>
  )
})

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
  const { theme } = useTheme()

  return (
    <View>
      <View style={styles.divider}>
        <View style={styles.commentCountContainer}>
          <Icon
            name="comment-text-outline"
            type="material-community"
            size={15}
            color={theme.colors.grey1}
          />
          <Text style={[styles.commentCount, { color: theme.colors.grey1 }]}>
            {allCount || 0}条评论
          </Text>
        </View>
        <View style={styles.right}>{props.dividerRight}</View>
      </View>
      {commentError ? (
        <View>
          <Text style={styles.commentTipText}>评论已关闭或加载失败</Text>
        </View>
      ) : null}
      {commentLoading ? <Loading /> : null}
      {comments?.length ? (
        comments.map((comment, i) => {
          return (
            <View key={comment.id + '@' + i} style={{ marginBottom: 10 }}>
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
    borderBottomWidth: 0.5,
    borderBottomColor: '#aaa',
    paddingBottom: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  commentCount: {
    fontSize: 13,
    marginRight: 12,
    paddingHorizontal: 8,
  },
  right: {
    marginLeft: 8,
    marginRight: 4,
  },
})

export default CommentList
