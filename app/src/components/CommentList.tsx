import { Icon, Skeleton, Text } from "@/components/styled/rneui";
import { FlashList } from "@/components/styled/rneui";
import { clsx } from "clsx";
import React from "react";
import { TouchableOpacity, View } from "react-native";

import { colors } from "@/constants/colors.tw";

import { type CommentItemType, useComments } from "../api/comments";
import { Comment } from "./Comment";
import ReplyList from "./ReplyList";

const LOADING_COMMENT_WIDTHS = [78, 62, 90, 45, 72, 55, 85, 68, 40, 95];

function Loading() {
  return (
    <View>
      {Array(10)
        .fill(0)
        .map((_, i) => {
          return (
            <View className="mb-5 flex-1 gap-1" key={i}>
              <Skeleton animation="wave" width="100%" height={16} />
              {i % 2 ? <Skeleton animation="wave" width="100%" height={16} /> : null}
              <Skeleton
                animation="wave"
                width={`${LOADING_COMMENT_WIDTHS[i % LOADING_COMMENT_WIDTHS.length]}%`}
                height={16}
              />
            </View>
          );
        })}
    </View>
  );
}

export default function CommentList(
  props: React.PropsWithChildren<{
    commentId: string | number;
    commentType: number;
    ownerName?: string;
    refreshing?: boolean;
    onRefresh?: () => void | Promise<void>;
    dividerRight?: React.ReactNode;
  }>,
) {
  const [mode, setMode] = React.useState(3);
  const {
    data: { replies: comments, allCount },
    isLoading,
    isValidating,
    isRefreshing,
    isLimited,
    isReachingEnd,
    error,
    update,
    refresh,
  } = useComments(props.commentId, props.commentType, mode);

  return (
    <View className="flex-1">
      <FlashList
        data={comments}
        keyExtractor={(v: CommentItemType) => `${v.id}@${v.root}`}
        renderItem={({ item }: { item: CommentItemType }) => {
          return <Comment comment={item} ownerName={props.ownerName} />;
        }}
        // persistentScrollbar
        ListHeaderComponent={
          <View className="flex-1 shrink-0">
            {props.children}
            <View className="my-5 flex-row justify-between border-b-[0.5px] border-gray-400 pb-1">
              <View className="mr-1 flex-row items-center">
                <Icon
                  name="comment-text-outline"
                  type="material-community"
                  size={14}
                  colorClassName={colors.gray6.accent}
                />
                <Text className={`mr-3 px-1 text-xs ${colors.gray6.text}`}>
                  {allCount ? `${allCount}条评论` : isLoading ? "加载中" : "暂无评论"}
                </Text>
              </View>
              <View className="ml-2 mr-1 flex-row items-center gap-2">
                {props.dividerRight}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setMode(mode === 3 ? 2 : 3);
                  }}
                >
                  <Text className={clsx("text-sm", colors.primary.text)}>
                    {mode === 3 ? "按热度" : "按时间"}
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
            <Text className="my-10 text-center text-base">
              {error ? "评论已关闭或加载失败" : "暂无评论"}
            </Text>
          )
        }
        ListFooterComponent={
          comments?.length ? (
            <Text className={`${colors.gray6.text} text-center text-xs`}>
              {isValidating
                ? "正在加载..."
                : isLimited
                  ? "匿名状态仅展示部分评论"
                  : isReachingEnd
                    ? "暂无更多"
                    : "上拉加载更多"}
            </Text>
          ) : null
        }
        contentContainerClassName="p-3 pt-4"
        refreshing={isRefreshing || props.refreshing}
        onRefresh={() => {
          void Promise.all([refresh(), props.onRefresh?.()]);
        }}
        onEndReached={() => {
          update();
        }}
        onEndReachedThreshold={1}
      />
      {/* <MoreReplies /> */}
      <ReplyList ownerName={props.ownerName} />
    </View>
  );
}
