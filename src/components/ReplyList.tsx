import { useFocusEffect } from '@react-navigation/native'
import { BottomSheet, Icon, Text } from '@rn-vui/themed'
import { FlashList } from '@shopify/flash-list'
import React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { type ReplyItemType, useReplies } from '@/api/replies'
import { colors } from '@/constants/colors.tw'
import useMemoizedFn from '@/hooks/useMemoizedFn'
import { useStore } from '@/store'

import { CommentItem } from './Comment'

export default function ReplyList() {
  const {
    data: { replies, allCount, root },
    isLoading,
    isValidating,
    error,
    update,
  } = useReplies()
  const { setRepliesInfo, repliesInfo } = useStore()
  const handleClose = useMemoizedFn(() => {
    setRepliesInfo(null)
  })

  useFocusEffect(handleClose)

  return (
    <BottomSheet
      onBackdropPress={handleClose}
      modalProps={{
        onRequestClose: handleClose,
        statusBarTranslucent: true,
      }}
      isVisible={!!repliesInfo}>
      <View className="h-[68vh] bg-neutral-100 dark:bg-neutral-700">
        <View className="flex-row items-center justify-between border-gray-500 px-3 py-2">
          <Text className="text-base font-semibold">
            评论详情
            {typeof allCount === 'number'
              ? `（${allCount}条）`
              : isLoading
                ? '...'
                : ''}
          </Text>
          <Icon
            name="close"
            size={20}
            className="rounded-sm p-1"
            onPress={handleClose}
          />
        </View>
        <View className="flex-1 bg-neutral-200 dark:bg-neutral-900">
          <FlashList
            data={replies}
            keyExtractor={(v) => `${v.id}@${v.root}`}
            renderItem={({ item }: { item: ReplyItemType }) => {
              return (
                <View className="mb-2 px-5">
                  <CommentItem comment={item} smallFont={false} />
                </View>
              )
            }}
            estimatedItemSize={30}
            ListHeaderComponent={
              root ? (
                <View className="mb-5 border-b-[18px] border-b-neutral-300 p-4 dark:border-b-neutral-700">
                  <CommentItem comment={root} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              isLoading ? (
                <View className="h-40 flex-1 items-center justify-center">
                  <ActivityIndicator
                    size={50}
                    color={tw(colors.secondary.text).color}
                  />
                </View>
              ) : (
                <Text className="my-10 text-center text-base">
                  {error ? '评论已关闭或加载失败' : '暂无评论'}
                </Text>
              )
            }
            ListFooterComponent={
              replies?.length ? (
                <Text
                  className={`${colors.gray6.text} mt-1 text-center text-xs`}>
                  {isValidating ? '正在加载...' : '暂无更多'}
                </Text>
              ) : null
            }
            contentContainerStyle={tw('pb-5')}
            onEndReached={() => {
              update()
            }}
            onEndReachedThreshold={1}
          />
        </View>
      </View>
    </BottomSheet>
  )
}
