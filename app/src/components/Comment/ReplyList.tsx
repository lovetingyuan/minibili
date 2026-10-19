import { useIsFocused } from '@react-navigation/native'
import type { FlashListRef } from '@shopify/flash-list'
import { useEffect, useRef } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { X } from 'lucide-react-native'

import { useReplies } from '@/api/replies'
import type { ReplyItemType } from '@/api/replies'
import { BottomSheet } from '@/components/BottomSheet'
import { FlashList } from '@/components/FlashList'
import { Text } from '@/components/Text'
import { LoadErrorText } from '@/components/LoadErrorText'
import { ThemedIcon } from '@/components/ThemedIcon'
import { theme } from '@/constants/colors.tw'
import { getStoreMethods, useStore } from '@/store'

import { CommentItem } from './Comment'
import CommentPaginationFooter from './CommentPaginationFooter'
import { removeReplyFromInfo } from './reply-list.helpers'
import type { ReplyListProps } from './reply-list.types'
import ReplyComposer from './ReplyComposer'
import ReplySheetContent from './ReplySheetContent'

const SHEET_BACKDROP_OPACITY = 0.5

export default function ReplyList(props: ReplyListProps) {
  const replies = useReplies()
  const { setRepliesInfo, repliesInfo } = useStore()
  const focused = useIsFocused()
  const listRef = useRef<FlashListRef<ReplyItemType>>(null)

  useEffect(() => {
    if (!focused) {
      setRepliesInfo(null)
    }
  }, [focused, setRepliesInfo])

  function handleClose() {
    setRepliesInfo(null)
  }

  function selectTarget(target: ReplyItemType) {
    if (repliesInfo) {
      setRepliesInfo({ ...repliesInfo, replyTarget: target, focusComposer: true })
    }
  }

  async function changeAttitude(item: ReplyItemType, kind: 'like' | 'dislike') {
    const next = await props.onAttitude(item, kind)
    if (next) {
      await replies.patchAttitude(item.id, next)
    } else {
      await replies.refresh().catch(() => {})
    }
    return next
  }

  async function submitReply(message: string) {
    if (!repliesInfo) {
      return false
    }
    const reply = await props.onSubmitReply(repliesInfo.replyTarget, message)
    if (!reply) {
      await replies.refresh().catch(() => {})
      return false
    }
    await replies.prependReply(reply)
    // 异步返回后取 store 里的最新快照，避免闭包里的 repliesInfo 过期
    const currentInfo = getStoreMethods().getRepliesInfo()
    if (currentInfo && String(currentInfo.root) === String(repliesInfo.root)) {
      setRepliesInfo({
        ...currentInfo,
        allCount: currentInfo.allCount + 1,
        previewReplies: [reply, ...currentInfo.previewReplies],
        addedReplies: [reply, ...currentInfo.addedReplies],
      })
    }
    listRef.current?.scrollToOffset({ offset: 0, animated: true })
    return true
  }

  async function deleteReply(target: ReplyItemType) {
    const deleted = await props.onDelete(target)
    if (!deleted) {
      await replies.refresh().catch(() => {})
      return false
    }
    const currentInfo = getStoreMethods().getRepliesInfo()
    if (!currentInfo || String(currentInfo.root) !== String(repliesInfo?.root)) {
      return true
    }
    if (target.id === String(currentInfo.root)) {
      setRepliesInfo(null)
      return true
    }
    await replies.removeReply(target.id)
    const latestInfo = getStoreMethods().getRepliesInfo()
    if (latestInfo && String(latestInfo.root) === String(currentInfo.root)) {
      setRepliesInfo(removeReplyFromInfo(latestInfo, target.id))
    }
    return true
  }

  function loadMore() {
    void replies.update()
  }

  const { allCount, root } = replies.data
  const ownerMid = repliesInfo?.ownerMid
  const rowProps = {
    ownerMid,
    onAttitude: changeAttitude,
    onReply: selectTarget,
    onDelete: deleteReply,
    viewerMid: props.viewerMid,
    isDeletePending: props.isDeletePending,
    isAttitudePending: props.isAttitudePending,
  }

  return (
    <BottomSheet
      backdropOpacity={SHEET_BACKDROP_OPACITY}
      onClose={handleClose}
      snapPoints={['70%']}
      index={0}
      visible={Boolean(repliesInfo)}
    >
      <ReplySheetContent>
        <View className="relative h-12 shrink-0 flex-row items-center justify-center border-b border-divider-subtle px-4">
          <Text className="text-base font-semibold tabular-nums">
            {typeof allCount === 'number' ? `${allCount} 条回复` : '回复'}
          </Text>
          <Pressable
            className="absolute right-2 h-11 w-11 items-center justify-center rounded-full"
            accessibilityRole="button"
            accessibilityLabel="关闭评论详情"
            onPress={handleClose}
          >
            <ThemedIcon icon={X} size={21} colorClassName={theme.icon.secondary} />
          </Pressable>
        </View>
        <FlashList
          key={`${repliesInfo?.type}:${repliesInfo?.oid}:${repliesInfo?.root}`}
          ref={listRef}
          className="min-h-0 flex-1"
          data={replies.data.replies}
          keyExtractor={(item: ReplyItemType) => item.id}
          renderItem={({ item }: { item: ReplyItemType }) => (
            <View className="border-b border-divider-subtle px-6 py-4">
              <CommentItem comment={item} {...rowProps} />
            </View>
          )}
          ListHeaderComponent={
            root ? (
              <View className="px-3 pb-2 pt-3">
                <Text className={`mb-2 px-1 text-xs font-medium ${theme.text.muted}`}>原评论</Text>
                <View className="rounded-2xl bg-fill-subtle p-3">
                  <CommentItem comment={root} {...rowProps} />
                </View>
                <View className="flex-row items-center justify-between px-1 pb-1 pt-4">
                  <Text className="text-sm font-semibold">全部回复</Text>
                  <Text className={`text-xs tabular-nums ${theme.text.muted}`}>
                    {typeof allCount === 'number' ? allCount : ''}
                  </Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            replies.isLoading ? (
              <View className="h-40 items-center justify-center">
                <ActivityIndicator size="large" colorClassName={theme.primary.accent} />
              </View>
            ) : replies.error ? (
              <LoadErrorText
                className="my-10 text-sm"
                disabled={replies.isValidating}
                onRetry={() => void replies.retry()}
              />
            ) : (
              <Text className="my-10 text-center text-sm">
                还没有回复，来说两句吧
              </Text>
            )
          }
          ListFooterComponent={
            <CommentPaginationFooter
              error={replies.error}
              hasItems={replies.data.replies.length > 0}
              isPageEnd={replies.isPageEnd}
              isValidating={replies.isValidating}
              noun="回复"
              onRetry={() => void replies.retry()}
            />
          }
          contentContainerClassName="pb-3"
          contentInsetAdjustmentBehavior="automatic"
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
        />
        {repliesInfo ? (
          <ReplyComposer
            target={repliesInfo.replyTarget}
            pending={props.isReplyPending(repliesInfo.replyTarget.id)}
            focusRequested={repliesInfo.focusComposer}
            onSubmit={submitReply}
          />
        ) : null}
      </ReplySheetContent>
    </BottomSheet>
  )
}
