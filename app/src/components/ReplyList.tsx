import { useIsFocused } from "@react-navigation/native";
import type { FlashListRef } from "@shopify/flash-list";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import type { Edge } from "react-native-safe-area-context";

import { useReplies } from "@/api/replies";
import type { ReplyItemType } from "@/api/replies";
import { BottomSheet, FlashList, Icon, Text } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import useKeyboardHeight from "@/hooks/useKeyboardHeight";
import { useStore } from "@/store";

import { CommentItem } from "./Comment";
import CommentPaginationFooter from "./CommentPaginationFooter";
import { removeReplyFromInfo } from "./reply-list.helpers";
import type { ReplyListProps } from "./reply-list.types";
import ReplyComposer from "./ReplyComposer";

const SHEET_SAFE_AREA_EDGES: Edge[] = ["top"];

export default function ReplyList(props: ReplyListProps) {
  const replies = useReplies();
  const { setRepliesInfo, repliesInfo } = useStore();
  const focused = useIsFocused();
  const listRef = useRef<FlashListRef<ReplyItemType>>(null);
  const keyboardHeight = useKeyboardHeight();
  const loadMoreLock = useRef(false);
  const repliesInfoRef = useRef(repliesInfo);
  repliesInfoRef.current = repliesInfo;

  useEffect(() => {
    if (!focused) setRepliesInfo(null);
  }, [focused, setRepliesInfo]);

  useEffect(() => {
    if (!replies.isValidating) loadMoreLock.current = false;
  }, [replies.isValidating, replies.data.replies.length]);

  function handleClose() {
    setRepliesInfo(null);
  }

  function selectTarget(target: ReplyItemType) {
    if (repliesInfo) {
      setRepliesInfo({ ...repliesInfo, replyTarget: target, focusComposer: true });
    }
  }

  async function changeAttitude(item: ReplyItemType, kind: "like" | "dislike") {
    const next = await props.onAttitude(item, kind);
    if (next) await replies.patchAttitude(item.id, next);
    else await replies.refresh().catch(() => {});
    return next;
  }

  async function submitReply(message: string) {
    if (!repliesInfo) return false;
    const reply = await props.onSubmitReply(repliesInfo.replyTarget, message);
    if (!reply) {
      await replies.refresh().catch(() => {});
      return false;
    }
    await replies.prependReply(reply);
    const currentInfo = repliesInfoRef.current;
    if (currentInfo && String(currentInfo.root) === String(repliesInfo.root)) {
      setRepliesInfo({
        ...currentInfo,
        allCount: currentInfo.allCount + 1,
        previewReplies: [reply, ...currentInfo.previewReplies],
        addedReplies: [reply, ...currentInfo.addedReplies],
      });
    }
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    return true;
  }

  async function deleteReply(target: ReplyItemType) {
    const deleted = await props.onDelete(target);
    if (!deleted) {
      await replies.refresh().catch(() => {});
      return false;
    }
    const currentInfo = repliesInfoRef.current;
    if (!currentInfo || String(currentInfo.root) !== String(repliesInfo?.root)) return true;
    if (target.id === String(currentInfo.root)) {
      setRepliesInfo(null);
      return true;
    }
    await replies.removeReply(target.id);
    const latestInfo = repliesInfoRef.current;
    if (latestInfo && String(latestInfo.root) === String(currentInfo.root)) {
      setRepliesInfo(removeReplyFromInfo(latestInfo, target.id));
    }
    return true;
  }

  function loadMore() {
    if (loadMoreLock.current || replies.isValidating || replies.isPageEnd || replies.error) return;
    loadMoreLock.current = true;
    replies.update();
  }

  const { allCount, root } = replies.data;
  const ownerMid = repliesInfo?.ownerMid;
  const rowProps = {
    ownerMid,
    onAttitude: changeAttitude,
    onReply: selectTarget,
    onDelete: deleteReply,
    viewerMid: props.viewerMid,
    isDeletePending: props.isDeletePending,
    isAttitudePending: props.isAttitudePending,
  };

  return (
    <BottomSheet
      backdropClassName="bg-black/50"
      edges={SHEET_SAFE_AREA_EDGES}
      onBackdropPress={handleClose}
      modalProps={{ onRequestClose: handleClose, statusBarTranslucent: true }}
      scrollViewProps={{ keyboardShouldPersistTaps: "handled" }}
      isVisible={Boolean(repliesInfo)}
    >
      <View
        className="h-[86vh] overflow-hidden rounded-t-[28px] bg-white dark:bg-neutral-950"
        style={{ paddingBottom: keyboardHeight }}
      >
        <View className="items-center pb-1.5 pt-2.5">
          <View className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        </View>
        <View className="relative h-12 flex-row items-center justify-center border-b border-neutral-100 px-4 dark:border-neutral-800">
          <Text className="text-base font-semibold tabular-nums">
            {typeof allCount === "number" ? `${allCount} 条回复` : "回复"}
          </Text>
          <Pressable
            className="absolute right-2 h-11 w-11 items-center justify-center rounded-full"
            accessibilityRole="button"
            accessibilityLabel="关闭评论详情"
            onPress={handleClose}
          >
            <Icon name="close" size={21} colorClassName={colors.gray7.accent} />
          </Pressable>
        </View>
        <FlashList
          ref={listRef}
          data={replies.data.replies}
          keyExtractor={(item: ReplyItemType) => item.id}
          renderItem={({ item }: { item: ReplyItemType }) => (
            <View className="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
              <CommentItem comment={item} {...rowProps} />
            </View>
          )}
          ListHeaderComponent={
            root ? (
              <View className="px-3 pb-2 pt-3">
                <Text className={`mb-2 px-1 text-xs font-medium ${colors.gray6.text}`}>原评论</Text>
                <View className="rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-900">
                  <CommentItem comment={root} {...rowProps} />
                </View>
                <View className="flex-row items-center justify-between px-1 pb-1 pt-4">
                  <Text className="text-sm font-semibold">全部回复</Text>
                  <Text className={`text-xs tabular-nums ${colors.gray6.text}`}>
                    {typeof allCount === "number" ? allCount : ""}
                  </Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            replies.isLoading ? (
              <View className="h-40 items-center justify-center">
                <ActivityIndicator size="large" colorClassName={colors.primary.accent} />
              </View>
            ) : (
              <Text className="my-10 text-center text-sm">
                {replies.error ? "回复加载失败" : "还没有回复，来说两句吧"}
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
          maintainVisibleContentPosition={{ disabled: true }}
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
      </View>
    </BottomSheet>
  );
}
