import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Icon, Text } from '@rneui/themed'
import React from 'react'
import { Pressable, View } from 'react-native'

import CommentList from '../../components/CommentList'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import type { RootStackParamList } from '../../types'
import { handleShareVideo, parseNumber, showToast } from '../../utils'
import { setViewingDynamicId } from '../../utils/report'
import DynamicItem from '../Dynamic/DynamicItem'

export default React.memo(DynamicDetail)

function DynamicDetail({
  route,
}: NativeStackScreenProps<RootStackParamList, 'DynamicDetail'>) {
  const {
    text,
    name,
    date,
    commentId,
    commentType,
    id,
    forwardCount,
    likeCount,
  } = route.params.detail
  useFocusEffect(
    useMemoizedFn(() => {
      setViewingDynamicId(id)
      return () => {
        setViewingDynamicId(null)
      }
    }),
  )

  return (
    <View className="flex-1">
      <CommentList
        commentId={commentId}
        commentType={commentType}
        dividerRight={
          <View className="flex-row shrink-0 min-w-20 gap-3 items-center text-gray-500">
            <View className="flex-row gap-1 items-center">
              <Icon
                name="date-range"
                size={15}
                color={tw('text-gray-600 dark:text-gray-300').color}
              />
              <Text className="text-xs text-gray-600 dark:text-gray-300">
                {date}
              </Text>
            </View>
            <Pressable
              className="flex-row gap-1 items-center"
              onPress={() => {
                showToast(`${likeCount} 点赞`)
              }}>
              <Icon
                name="thumb-up-off-alt"
                size={15}
                color={tw('text-gray-600 dark:text-gray-300').color}
              />
              {likeCount ? (
                <Text className="text-xs text-gray-600 dark:text-gray-300">
                  {parseNumber(likeCount)}
                </Text>
              ) : null}
            </Pressable>
            <Pressable
              className="flex-row items-center gap-1"
              onPress={() => {
                handleShareVideo(name, text ? text.substring(0, 30) : '-', id)
              }}>
              <Icon
                type="material-community"
                name="share"
                size={20}
                color={tw('text-gray-600 dark:text-gray-300').color}
              />
              {forwardCount ? (
                <Text className="text-xs text-gray-600 dark:text-gray-300">
                  {parseNumber(forwardCount)}
                </Text>
              ) : null}
            </Pressable>
          </View>
        }>
        <DynamicItem item={route.params.detail} />
      </CommentList>
    </View>
  )
}
