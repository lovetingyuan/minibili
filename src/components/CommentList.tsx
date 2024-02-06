import { Icon, Text, Skeleton } from '@rneui/themed'
import React from 'react'
import { View, Image } from 'react-native'
import { useDynamicComments } from '../api/comments'
import Comment from './Comment'
import MoreReplies from './MoreReplies'
import { colors } from '@/constants/colors.tw'

const Loading = React.memo(function Loading() {
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

  return (
    <View>
      <View className="my-5 border-b-[0.5px] border-gray-400 pb-1 flex-row justify-between">
        <View className="flex-row items-center mr-1">
          <Icon
            name="comment-text-outline"
            type="material-community"
            size={14}
            color={tw(colors.gray1.text).color}
          />
          <Text className="text-xs mr-3 px-2 text-gray-700 dark:text-gray-300">
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
          className="aspect-square mt-8 w-24 h-auto self-center"
        />
      ) : null}
      {comments?.length ? (
        <View className="mb-3 items-center">
          <Text className="text-xs mt-2 text-gray-500">只加载前30条</Text>
          <Text />
        </View>
      ) : null}
      <MoreReplies />
    </View>
  )
}
