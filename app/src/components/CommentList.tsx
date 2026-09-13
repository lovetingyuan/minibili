import { clsx } from "clsx";
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";

import type { CommentAttitudeKind } from "@/api/comment-actions.types";
import type { CommentItemType, ReplyItemType } from "@/api/comments";
import { useComments } from "@/api/comments";
import { useCommentActions } from "@/api/useCommentActions";
import { colors } from "@/constants/colors.tw";

import { Comment } from "./Comment";
import type { CommentListProps } from "./comment-list.types";
import ReplyList from "./ReplyList";
import { FlashList, Icon, Skeleton, Text } from "./styled/rneui";

export type { CommentListProps } from "./comment-list.types";

const LOADING_COMMENT_WIDTHS = [78, 62, 90, 45, 72, 55];

function Loading() {
  return (
    <View className="gap-5 py-2">
      {LOADING_COMMENT_WIDTHS.map((width, index) => (
        <View
          className="gap-2.5 border-b border-neutral-100 pb-4 dark:border-neutral-800"
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
          <View className="flex-row gap-3">
            <Skeleton animation="wave" width={52} height={28} />
            <Skeleton animation="wave" width={44} height={28} />
            <Skeleton animation="wave" width={58} height={28} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function CommentList(props: CommentListProps) {
  const [mode, setMode] = useState(3);
  const comments = useComments(props.commentId, props.commentType, mode);
  const loadMoreLock = useRef(false);
  const actions = useCommentActions(props.sourceUrl, comments.refresh);

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
    const rootId = String(target.root) === "0" ? target.id : String(target.root);
    await comments.prependReply(rootId, reply);
    return reply;
  }

  function loadMore() {
    if (loadMoreLock.current || comments.isValidating || comments.isReachingEnd) return;
    loadMoreLock.current = true;
    comments.update();
  }

  const allCount = comments.data.allCount;
  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <FlashList
        data={comments.data.replies}
        keyExtractor={(item: CommentItemType) => item.id}
        renderItem={({ item }: { item: CommentItemType }) => (
          <Comment
            comment={item}
            ownerMid={comments.data.ownerMid}
            sourceUrl={props.sourceUrl}
            onAttitude={changeAttitude}
            isAttitudePending={actions.isAttitudePending}
          />
        )}
        ListHeaderComponent={
          <View>
            {props.children}
            <View className="mt-3 flex-row items-center justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800">
              <View className="flex-row items-center gap-1.5">
                <Icon
                  name="comment-text-outline"
                  type="material-community"
                  size={16}
                  colorClassName={colors.gray7.accent}
                />
                <Text className="text-base font-semibold">
                  评论
                  <Text className={`text-xs font-normal ${colors.gray6.text}`}>
                    {typeof allCount === "number"
                      ? ` ${allCount}`
                      : comments.isLoading
                        ? " 加载中"
                        : ""}
                  </Text>
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                {props.dividerRight}
                <Pressable
                  className="rounded-full bg-neutral-100 px-3 py-1.5 dark:bg-neutral-800"
                  accessibilityRole="button"
                  accessibilityLabel={`当前按${mode === 3 ? "热度" : "时间"}排序，点击切换`}
                  onPress={() => setMode((current) => (current === 3 ? 2 : 3))}
                >
                  <Text className={clsx("text-xs font-medium", colors.primary.text)}>
                    {mode === 3 ? "按热度" : "按时间"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          comments.isLoading ? (
            <Loading />
          ) : (
            <Text className="my-12 text-center text-sm">
              {comments.error ? "评论已关闭或加载失败" : "还没有评论"}
            </Text>
          )
        }
        ListFooterComponent={
          <View className="h-12 items-center justify-center">
            {comments.data.replies.length ? (
              <Text className={`text-xs ${colors.gray6.text}`}>
                {comments.isValidating
                  ? "正在加载..."
                  : comments.isLimited
                    ? "匿名状态仅展示部分评论"
                    : comments.isReachingEnd
                      ? "没有更多评论了"
                      : "上拉加载更多"}
              </Text>
            ) : null}
          </View>
        }
        contentContainerClassName="px-3 pt-4"
        contentInsetAdjustmentBehavior="automatic"
        maintainVisibleContentPosition={{ disabled: true }}
        refreshing={comments.isRefreshing || props.refreshing}
        onRefresh={() => void Promise.all([comments.refresh(), props.onRefresh?.()])}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
      />
      <ReplyList
        onAttitude={changeAttitude}
        onSubmitReply={submitReply}
        isAttitudePending={actions.isAttitudePending}
        isReplyPending={actions.isReplyPending}
      />
    </View>
  );
}
