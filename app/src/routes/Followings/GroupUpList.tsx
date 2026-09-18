import React from "react";
import { ActivityIndicator, View } from "react-native";

import { RELATION_TAG_SPECIAL_ID } from "@/api/relation-tags";
import { useBilibiliRelationTagMembers } from "@/api/useBilibiliRelationTags";
import { Button, Text } from "@/components/styled/rneui";
import { colors } from "@/constants/colors.tw";
import { orderFollowedUps } from "@/features/bilibili-followings/order-followings";
import { useStore } from "@/store";
import { useUnreadUpMids } from "@/store/derives";
import type { UpInfo } from "@/types";

import FollowUpsGrid from "./FollowUpsGrid";

type Props = {
  tagid: number;
  specialMids?: ReadonlySet<string>;
  onSetGroups?: (up: UpInfo) => void;
  onRefreshTags?: () => void;
};

export default function GroupUpList({ tagid, specialMids, onSetGroups, onRefreshTags }: Props) {
  const members = useBilibiliRelationTagMembers(tagid);
  const { livingUps } = useStore();
  const unreadMids = useUnreadUpMids();
  const visibleItems =
    tagid === RELATION_TAG_SPECIAL_ID && specialMids
      ? members.items.filter((up) => specialMids.has(String(up.mid)))
      : members.items;
  const orderedUps = orderFollowedUps(visibleItems, livingUps, specialMids, unreadMids);
  const hasItems = visibleItems.length > 0;

  async function refresh() {
    await Promise.allSettled([members.refresh(), Promise.resolve(onRefreshTags?.())]);
  }

  return (
    <FollowUpsGrid
      ups={orderedUps}
      specialMids={specialMids}
      onSetGroups={onSetGroups}
      refreshing={hasItems && members.isValidating && !members.isLoadingMore}
      onRefresh={() => {
        void refresh();
      }}
      onEndReached={() => {
        void members.loadMore();
      }}
      onEndReachedThreshold={0.5}
      emptyContent={
        <View className="items-center justify-center gap-4 px-6 py-16">
          {members.isLoading ? (
            <ActivityIndicator />
          ) : members.error ? (
            <>
              <Text className="text-center">分组加载失败，请检查网络或登录状态后重试</Text>
              <Button
                title="重试"
                loading={members.isValidating}
                onPress={() => {
                  void members.mutate().catch(() => {});
                }}
              />
            </>
          ) : (
            <Text className={colors.gray6.text}>该分组暂无UP</Text>
          )}
        </View>
      }
      footer={
        members.error && hasItems ? (
          <View className="items-center gap-2 py-4">
            <Text className={`text-sm ${colors.gray6.text}`}>加载失败，已保留当前内容</Text>
            <Button
              title="重试"
              type="clear"
              loading={members.isValidating}
              onPress={() => {
                void members.mutate().catch(() => {});
              }}
            />
          </View>
        ) : members.isLoadingMore && hasItems ? (
          <ActivityIndicator className="my-4" />
        ) : hasItems && !members.hasMore ? (
          <Text className={`py-4 text-center text-xs ${colors.gray6.text}`}>到底了~</Text>
        ) : null
      }
    />
  );
}
