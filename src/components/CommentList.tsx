import { Icon, Text, useTheme, Skeleton } from '@rneui/themed'
import React from 'react'
import { View, Image, useWindowDimensions } from 'react-native'
import { useDynamicComments } from '../api/comments'
import Comment from './Comment'
import MoreReplies from './MoreReplies'

const Loading = React.memo(() => {
  return (
    <View>
      {Array(10)
        .fill(0)
        .map((_, i) => {
          return (
            <View className="flex-1 gap-1 mb-5" key={i}>
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

export default function CommentList(props: {
  commentId: string | number
  commentType: number
  upName: string
  dividerRight?: React.ReactNode
}) {
  const {
    data: { replies: comments, allCount },
    isLoading: commentLoading,
    error: commentError,
  } = useDynamicComments(props.commentId, props.commentType)
  const { width } = useWindowDimensions()
  const { theme } = useTheme()
  return (
    <View>
      <View className="my-5 border-b-[0.5px] border-gray-400 pb-1 flex-row justify-between">
        <View className="flex-row items-center mr-1">
          <Icon
            name="comment-text-outline"
            type="material-community"
            size={14}
            color={theme.colors.grey1}
          />
          <Text
            className="text-xs mr-3 px-2"
            style={{ color: theme.colors.grey1 }}>
            {allCount ? allCount + '条评论' : '暂无评论'}
          </Text>
        </View>
        <View className="ml-2 mr-1">{props.dividerRight}</View>
      </View>
      {commentError ? (
        <View>
          <Text className="text-center my-5">评论已关闭或加载失败</Text>
        </View>
      ) : null}
      {commentLoading ? <Loading /> : null}
      {comments?.length ? (
        comments.map((comment, i) => {
          return (
            <View key={comment.id + '@' + i} className="mb-3">
              <Comment upName={props.upName} comment={comment} />
            </View>
          )
        })
      ) : comments?.length === 0 && !commentLoading ? (
        <Image
          source={require('../../assets/empty.png')}
          className="aspect-square mt-7 self-center"
          style={{
            width: width * 0.2,
            height: undefined,
          }}
        />
      ) : null}
      {comments?.length ? (
        <View className="mb-3 items-center">
          <Text className="text-xs mt-2" style={{ color: theme.colors.grey3 }}>
            只加载前30条
          </Text>
          <Text />
        </View>
      ) : null}
      <MoreReplies />
    </View>
  )
}
