import { Icon, Skeleton, Text } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import clsx from 'clsx'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { colors } from '@/constants/colors.tw'

import { type CommentItemType, useComments } from '../api/comments'
import { Comment } from './Comment'
import ReplyList from './ReplyList'

function Loading() {
  return (
    <View>
      {Array(10)
        .fill(0)
        .map((_, i) => {
          return (
            <View className="flex-1 gap-1 mb-5" key={i}>
              <Skeleton animation="wave" width={'100%' as any} height={16} />
              {i % 2 ? (
                <Skeleton animation="wave" width={'100%' as any} height={16} />
              ) : null}
              <Skeleton
                animation="wave"
                width={`${Math.random() * 100}%` as any}
                height={16}
              />
            </View>
          )
        })}
    </View>
  )
}

export default function CommentList(
  props: React.PropsWithChildren<{
    commentId: string | number
    commentType: number
    dividerRight?: React.ReactNode
  }>,
) {
  const [mode, setMode] = React.useState(3)
  const {
    data: { replies: comments, allCount },
    isLoading,
    isValidating,
    error,
    update,
  } = useComments(props.commentId, props.commentType, mode)

  return (
    <View className="flex-1">
      <FlashList
        data={comments}
        keyExtractor={(v) => `${v.id}@${v.root}`}
        renderItem={({ item }: { item: CommentItemType }) => {
          return <Comment comment={item} />
        }}
        // persistentScrollbar
        estimatedItemSize={50}
        ListHeaderComponent={
          <View className="flex-1 shrink-0">
            {props.children}
            <View className="my-5 pb-1 border-b-[0.5px] border-gray-400 flex-row justify-between">
              <View className="flex-row items-center mr-1">
                <Icon
                  name="comment-text-outline"
                  type="material-community"
                  size={14}
                  color={tw(colors.gray6.text).color}
                />
                <Text className={`text-xs mr-3 px-1 ${colors.gray6.text}`}>
                  {allCount
                    ? `${allCount}条评论`
                    : isLoading
                      ? '加载中'
                      : '暂无评论'}
                </Text>
              </View>
              <View className="ml-2 mr-1 flex-row gap-2 items-center">
                {props.dividerRight}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setMode(mode === 3 ? 2 : 3)
                  }}>
                  <Text className={clsx('text-sm', colors.primary.text)}>
                    {mode === 3 ? '按热度' : '按时间'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <Loading />
          ) : (
            <Text className="text-center text-base my-10">
              {error ? '评论已关闭或加载失败' : '暂无评论'}
            </Text>
          )
        }
        ListFooterComponent={
          comments?.length ? (
            <Text className={`${colors.gray6.text} text-xs text-center`}>
              {isValidating ? '正在加载...' : '暂无更多'}
            </Text>
          ) : null
        }
        contentContainerStyle={tw('p-3 pt-4')}
        onEndReached={() => {
          update()
        }}
        onEndReachedThreshold={1}
      />
      {/* <MoreReplies /> */}
      <ReplyList />
    </View>
  )
}
