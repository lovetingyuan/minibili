import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';

import type { CommentAttitudeKind } from '@/api/comment-actions.types';
import type { CommentItemType, ReplyItemType } from '@/api/comments';
import { useComments } from '@/api/comments';
import { useCommentActions } from '@/api/useCommentActions';
import { colors } from '@/constants/colors.tw';
import useKeyboardHeight from '@/hooks/useKeyboardHeight';
import { showToast } from '@/utils';

import { Comment } from './Comment';
import CommentComposer from './CommentComposer';
import CommentPaginationFooter from './CommentPaginationFooter';
import type { CommentListProps } from './comment-list.types';
import ReplyList from './ReplyList';
import { FlashList, Icon, Skeleton, Text } from './styled/rneui';

export type { CommentListProps } from './comment-list.types';

const LOADING_COMMENT_WIDTHS = [78, 62, 90, 45, 72, 55];

function CommentSeparator() {
  return <View className="h-3" />;
}

function Loading() {
  return (
    <View className="gap-3">
      {LOADING_COMMENT_WIDTHS.map((width, index) => (
        <View
          className={clsx('gap-2.5 bg-white p-3 dark:bg-neutral-900', index === 0 ? 'rounded-b-2xl' : 'rounded-2xl')}
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
  );
}

export default function CommentList(props: CommentListProps) {
  const [mode, setMode] = useState(3);
  const [composing, setComposing] = useState(false);
  const comments = useComments(props.commentId, props.commentType, mode);
  const keyboardHeight = useKeyboardHeight();
  const loadMoreLock = useRef(false);
  const actions = useCommentActions(props.commentId, props.commentType, props.sourceUrl, comments.refresh);

  useEffect(() => {
    if (!comments.isValidating) loadMoreLock.current = false;
  }, [comments.isValidating, comments.data.replies.length]);

  async function changeAttitude(item: ReplyItemType, kind: CommentAttitudeKind) {
    const next = await actions.changeAttitude(item, item.attitude, kind);
    if (next) await comments.patchAttitude(item.id, next);
    return next;
  }

  async function submitReply(target: ReplyItemType, message: string) {
    const reply = await actions.submitReply(target, message);
    if (!reply) return null;
    const rootId = String(target.root) === '0' ? target.id : String(target.root);
    await comments.prependReply(rootId, reply);
    return reply;
  }

  async function submitComment(message: string) {
    const comment = await actions.submitComment(message);
    if (!comment) return false;
    await comments.prependComment(comment);
    Keyboard.dismiss();
    setComposing(false);
    showToast('评论成功');
    return true;
  }

  async function deleteComment(target: ReplyItemType) {
    if (!(await actions.removeComment(target))) return false;
    await comments.removeComment(target);
    return true;
  }

  function openComposer() {
    setComposing(true);
  }

  function closeComposer() {
    Keyboard.dismiss();
    setComposing(false);
  }

  function loadMore() {
    if (loadMoreLock.current || comments.isValidating || comments.isPageEnd || comments.error) return;
    loadMoreLock.current = true;
    comments.update();
  }

  const allCount = comments.data.allCount;
  return (
    <View className="flex-1">
      <FlashList
        className="flex-1 bg-neutral-100 dark:bg-black"
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
            <View className="bg-white px-3 pt-4 pb-3 dark:bg-neutral-950">{props.children}</View>
            <View className="h-2 bg-neutral-100 dark:bg-black" />
            <View className="flex-row items-center justify-between border-b border-neutral-100 bg-white px-3 pb-2 pt-3 dark:border-neutral-800 dark:bg-neutral-950">
              <View className="flex-row items-center gap-1.5">
                <Icon
                  name="comment-text-outline"
                  type="material-community"
                  size={14}
                  colorClassName={colors.gray7.accent}
                />
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm font-semibold">评论</Text>
                  {typeof allCount === 'number' ? (
                    <Text className={`text-xs font-normal ${colors.gray6.text}`}>{allCount}条</Text>
                  ) : comments.isLoading ? (
                    <Text className={`text-xs font-normal ${colors.gray6.text}`}>加载中</Text>
                  ) : null}
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                {props.dividerRight}
                <Pressable
                  className="flex-row items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 dark:bg-neutral-800"
                  accessibilityRole="button"
                  accessibilityLabel={`当前按${mode === 3 ? '热度' : '时间'}排序，点击切换`}
                  onPress={() => setMode((current) => (current === 3 ? 2 : 3))}
                >
                  <Icon
                    name="sort-variant"
                    type="material-community"
                    size={14}
                    colorClassName={colors.primary.accent}
                  />
                  <Text className={clsx('text-xs font-medium', colors.primary.text)}>
                    {mode === 3 ? '按热度' : '按时间'}
                  </Text>
                </Pressable>
                <Pressable
                  className="flex-row items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 dark:bg-neutral-800"
                  accessibilityRole="button"
                  accessibilityLabel="写评论"
                  onPress={openComposer}
                >
                  <Icon
                    name="comment-plus-outline"
                    type="material-community"
                    size={14}
                    colorClassName={colors.primary.accent}
                  />
                  <Text className={clsx('text-xs font-medium', colors.primary.text)}>写评论</Text>
                </Pressable>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          comments.isLoading ? (
            <Loading />
          ) : (
            <Text className="my-12 text-center text-sm">{comments.error ? '评论已关闭或加载失败' : '还没有评论'}</Text>
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
        maintainVisibleContentPosition={{ disabled: true }}
        refreshing={comments.isRefreshing || props.refreshing}
        onRefresh={() => void Promise.all([comments.refresh(), props.onRefresh?.()])}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
      />
      {composing ? (
        <View className="absolute left-0 right-0" style={{ bottom: keyboardHeight }}>
          <CommentComposer pending={actions.isCommentPending} onSubmit={submitComment} onClose={closeComposer} />
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
  );
}
