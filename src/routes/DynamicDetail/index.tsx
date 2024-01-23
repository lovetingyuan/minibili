import React from 'react'
import { View, Pressable, ScrollView } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../types'
import CommentList from '../../components/CommentList'
import { Icon, Text, useTheme } from '@rneui/themed'
import { handleShareVideo, parseNumber, showToast } from '../../utils'
import DynamicItem from '../Dynamic/DynamicItem'
import { useFocusEffect } from '@react-navigation/native'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import { setViewingDynamicId } from '../../utils/report'

export default React.memo(function DynamicDetail({
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
  const { theme } = useTheme()
  return (
    <ScrollView className="flex-1 px-3 pt-5">
      <DynamicItem item={route.params.detail} />
      <CommentList
        upName={name}
        commentId={commentId}
        commentType={commentType}
        dividerRight={
          <View className="flex-row shrink-0 min-w-20 gap-3 items-center text-gray-500">
            <View className="flex-row gap-1 items-center">
              <Icon name="date-range" size={15} color={theme.colors.grey1} />
              <Text style={{ color: theme.colors.grey1 }} className="text-xs">
                {date}
              </Text>
            </View>
            <Pressable
              className="flex-row gap-1 items-center"
              onPress={() => {
                showToast('不支持点赞')
              }}>
              <Icon
                name="thumb-up-off-alt"
                size={15}
                color={theme.colors.grey1}
              />
              {likeCount ? (
                <Text className="text-xs" style={{ color: theme.colors.grey1 }}>
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
                color={theme.colors.grey1}
              />
              {forwardCount ? (
                <Text className="text-xs" style={{ color: theme.colors.grey1 }}>
                  {parseNumber(forwardCount)}
                </Text>
              ) : null}
            </Pressable>
          </View>
        }
      />
    </ScrollView>
  )
})
