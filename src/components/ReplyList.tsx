import { useFocusEffect } from '@react-navigation/native'
import { BottomSheet, Icon, Text } from '@rneui/themed'
import { FlashList } from '@shopify/flash-list'
import React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { ReplyItemType, useReplies } from '@/api/replies'
import { colors } from '@/constants/colors.tw'
import { useStore } from '@/store'

import Comment from './Comment'

export default function ReplyList() {
  const {
    data: { replies, allCount, root },
    isLoading,
    isValidating,
    error,
    update,
  } = useReplies()
  const { setRepliesInfo, repliesInfo } = useStore()
  const handleClose = () => {
    setRepliesInfo(null)
  }

  useFocusEffect(
    React.useCallback(() => {
      return handleClose
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  )

  return (
    <BottomSheet
      onBackdropPress={handleClose}
      modalProps={{
        onRequestClose: handleClose,
      }}
      isVisible={!!repliesInfo}>
      <View className="h-[68vh] bg-neutral-100 dark:bg-neutral-700">
        <View className="py-2 px-3 flex-row items-center border-gray-500 justify-between">
          <Text className="text-lg font-bold">
            评论详情{typeof allCount === 'number' ? `（${allCount}）` : ''}
          </Text>
          <Icon
            name="close"
            size={20}
            className="p-1 rounded-sm"
            onPress={handleClose}
          />
        </View>
        <View className="flex-1 bg-neutral-200 dark:bg-neutral-900">
          <FlashList
            data={replies}
            keyExtractor={v => v.id + '@' + v.root}
            renderItem={({ item }: { item: ReplyItemType }) => {
              return <Comment comment={item} className="pl-3 mb-2" />
            }}
            estimatedItemSize={50}
            ListHeaderComponent={
              root ? (
                <View className="border-b-[1px] border-b-neutral-300 dark:border-b-neutral-700 mb-4">
                  <Comment comment={root} className="mb-2" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              isLoading ? (
                <View className="flex-1 h-40 justify-center items-center">
                  <ActivityIndicator
                    size={50}
                    color={tw(colors.secondary.text).color}
                  />
                </View>
              ) : (
                <Text className="text-center text-base my-10">
                  {error ? '评论已关闭或加载失败' : '暂无评论'}
                </Text>
              )
            }
            ListFooterComponent={
              replies?.length ? (
                <Text className={`${colors.gray6.text} text-xs text-center`}>
                  {isValidating ? '正在加载...' : '暂无更多'}
                </Text>
              ) : null
            }
            contentContainerStyle={tw('px-3 py-5')}
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
