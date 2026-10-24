import { clsx } from 'clsx'
import { useIsFocused } from '@react-navigation/native'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Keyboard, Pressable, View } from 'react-native'
import { ArrowDownUp, MessageSquarePlus, MessageSquareText } from 'lucide-react-native'

import type { CommentAttitudeKind } from '@/api/comment-actions.types'
import type { CommentItemType, ReplyItemType } from '@/api/comments'
import { useComments } from '@/api/comments'
import { useCommentActions } from '@/api/useCommentActions'
import { theme } from '@/constants/colors.tw'
import { ThemedIcon } from '@/components/ThemedIcon'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import useKeyboardHeight from '@/hooks/useKeyboardHeight'
import { showToast } from '@/utils'

import { Comment } from './Comment'
import CommentComposer from './CommentComposer'
import { getCommentListEmptyText } from './comment-list.helpers'
import CommentPaginationFooter from './CommentPaginationFooter'
import type { CommentListProps } from './comment-list.types'
import ReplyList from './ReplyList'
import { FlashList } from '@/components/FlashList'
import { Skeleton } from '@/components/Skeleton'
import { Text } from '@/components/Text'
import { LoadErrorText } from '@/components/LoadErrorText'

const LOADING_COMMENT_WIDTHS = [78, 62, 90, 45, 72, 55]

function CommentSeparator() {
  return <View className="h-3" />
}

function Loading() {
  return (
    <View className="gap-3">
      {LOADING_COMMENT_WIDTHS.map((width, index) => (
        <View
          className={clsx(
            'gap-2.5 bg-overlay p-3',
            index === 0 ? 'rounded-b-2xl' : 'rounded-2xl',
          )}
          key={width}
        >
          <View className="flex-row items-center gap-2.5">
            <Skeleton animation="wave" circle width={36} height={36} />
            <View className="flex-1 gap-1.5">
              <Skeleton animation="wave" width={`${Math.max(25, width / 2)}%`} height={13} />
              <Skeleton animation="wave" width="35%" height={10} />
            </View>
          </View>
          <Skeleton animation="wave" width={`${width}%`} height={16} />
          {index % 2 ? <Skeleton animation="wave" width="55%" height={16} /> : null}
        </View>
      ))}
    </View>
  )
}

export default function CommentList(props: CommentListProps) {
  const [mode, setMode] = useState(3)
  const [composing, setComposing] = useState(false)
  const [closingComposer, setClosingComposer] = useState(false)
  const focused = useIsFocused()
  const listKey = `${props.commentType}:${props.commentId}:${mode}`
  const listSession = useRef<symbol | null>(null)
  const comments = useComments(props.commentId, props.commentType, mode)
  const keyboardHeight = useKeyboardHeight()
  const actions = useCommentActions(
    props.commentId,
    props.commentType,
    props.sourceUrl,
    comments.refresh,
  )
  const pullToRefresh = usePullToRefresh(() =>
    Promise.allSettled([comments.refresh(), props.onRefresh?.()]),
  )

  // 切换列表或离开页面后，旧发送结果不能再关闭当前输入框。
  useLayoutEffect(() => {
    listSession.current = focused ? Symbol(listKey) : null
    return () => {
      listSession.current = null
    }
  }, [listKey, focused])

  useEffect(() => {
    if (!closingComposer) {
      return
    }
    function finishClosing() {
      setComposing(false)
      setClosingComposer(false)
    }
    // 关闭时先隐藏输入条，原生输入节点等键盘收起后再释放。
    const subscription = Keyboard.addListener('keyboardDidHide', finishClosing)
    if (Keyboard.isVisible()) {
      Keyboard.dismiss()
    } else {
      finishClosing()
    }
    return () => subscription.remove()
  }, [closingComposer])

  async function changeAttitude(item: ReplyItemType, kind: CommentAttitudeKind) {
    const next = await actions.changeAttitude(item, item.attitude, kind)
    if (next) {
      await comments.patchAttitude(item.id, next)
    }
    return next
  }

  async function submitReply(target: ReplyItemType, message: string) {
    const reply = await actions.submitReply(target, message)
    if (!reply) {
      return null
    }
    const rootId = String(target.root) === '0' ? target.id : String(target.root)
    await comments.prependReply(rootId, reply)
    return reply
  }

  async function submitComment(message: string) {
    const submittingSession = listSession.current
    const comment = await actions.submitComment(message)
    if (!comment) {
      return false
    }
    await comments.prependComment(comment)
    if (listSession.current !== submittingSession) {
      return true
    }
    closeComposer()
    showToast('评论成功')
    return true
  }

  async function deleteComment(target: ReplyItemType) {
    if (!(await actions.removeComment(target))) {
      return false
    }
    await comments.removeComment(target)
    return true
  }

  function openComposer() {
    setClosingComposer(false)
    setComposing(true)
  }

  function closeComposer() {
    setClosingComposer(true)
  }

  function loadMore() {
    void comments.update()
  }

  const allCount = comments.data.allCount ?? props.commentCount
  const header =
    typeof props.children === 'function' ? props.children({ openComposer }) : props.children
  return (
    <View className="flex-1">
      <FlashList
        key={listKey}
        className={`flex-1 ${theme.background.page}`}
        data={comments.data.replies}
        keyExtractor={(item: CommentItemType) => item.id}
        renderItem={({ item, index }: { item: CommentItemType; index: number }) => (
          <Comment
            comment={item}
            first={index === 0}
            ownerMid={comments.data.ownerMid}
            sourceUrl={props.sourceUrl}
            onAttitude={changeAttitude}
            onDelete={deleteComment}
            viewerMid={actions.viewerMid}
            isDeletePending={actions.isDeletePending}
            isAttitudePending={actions.isAttitudePending}
          />
        )}
        ItemSeparatorComponent={CommentSeparator}
        ListHeaderComponent={
          <View>
            <View className="bg-surface px-3 pt-4 pb-3">{header}</View>
            <View className={`h-2 ${theme.background.page}`} />
            <View className="flex-row items-center justify-between border-b border-divider-subtle bg-surface px-3 pb-2 pt-3">
              <View className="flex-row items-center gap-1.5">
                <ThemedIcon
                  icon={MessageSquareText}
                  size={16}
                  colorClassName={theme.icon.secondary}
                />
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm font-semibold">评论</Text>
                  {typeof allCount === 'number' ? (
                    <Text className={`text-xs font-normal ${theme.text.muted}`}>{allCount}条</Text>
                  ) : comments.isLoading ? (
                    <Text className={`text-xs font-normal ${theme.text.muted}`}>加载中</Text>
                  ) : null}
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                {props.dividerRight}
                <Pressable
                  className="flex-row items-center gap-1 rounded-full bg-fill-raised px-3 py-1.5"
                  accessibilityRole="button"
                  accessibilityLabel={`当前按${mode === 3 ? '热度' : '时间'}排序，点击切换`}
                  onPress={() => setMode(current => (current === 3 ? 2 : 3))}
                >
                  <ThemedIcon icon={ArrowDownUp} size={14} colorClassName={theme.primary.accent} />
                  <Text className={clsx('text-xs font-medium', theme.primary.text)}>
                    {mode === 3 ? '按热度' : '按时间'}
                  </Text>
                </Pressable>
                <Pressable
                  className="flex-row items-center gap-1 rounded-full bg-fill-raised px-3 py-1.5"
                  accessibilityRole="button"
                  accessibilityLabel="写评论"
                  onPress={openComposer}
                >
                  <ThemedIcon
                    icon={MessageSquarePlus}
                    size={14}
                    colorClassName={theme.primary.accent}
                  />
                  <Text className={clsx('text-xs font-medium', theme.primary.text)}>写评论</Text>
                </Pressable>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          comments.isLoading ? (
            <Loading />
          ) : comments.error ? (
            <LoadErrorText
              className="my-12 text-sm"
              disabled={comments.isValidating}
              onRetry={() => void comments.retry()}
            />
          ) : (
            <Text className="my-12 text-center text-sm">
              {getCommentListEmptyText(allCount, comments.error)}
            </Text>
          )
        }
        ListFooterComponent={
          <CommentPaginationFooter
            error={comments.error}
            hasItems={comments.data.replies.length > 0}
            isPageEnd={comments.isPageEnd}
            isValidating={comments.isValidating}
            noun="评论"
            onRetry={() => void comments.retry()}
          />
        }
        contentInsetAdjustmentBehavior="automatic"
        refreshing={pullToRefresh.refreshing || Boolean(props.refreshing)}
        onRefresh={pullToRefresh.onRefresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
      />
      {composing ? (
        <View
          className={clsx('absolute left-0 right-0', closingComposer && 'opacity-0')}
          style={{ bottom: keyboardHeight }}
          pointerEvents={closingComposer ? 'none' : 'auto'}
          accessibilityElementsHidden={closingComposer}
          importantForAccessibility={closingComposer ? 'no-hide-descendants' : 'auto'}
        >
          <CommentComposer
            pending={actions.isCommentPending}
            onSubmit={submitComment}
            onClose={closeComposer}
          />
        </View>
      ) : null}
      <ReplyList
        onAttitude={changeAttitude}
        onSubmitReply={submitReply}
        onDelete={deleteComment}
        viewerMid={actions.viewerMid}
        isAttitudePending={actions.isAttitudePending}
        isReplyPending={actions.isReplyPending}
        isDeletePending={actions.isDeletePending}
      />
    </View>
  )
}
