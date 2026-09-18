import { Text } from "@/components/styled/rneui";
import { orderFollowedUps } from "@/features/bilibili-followings/order-followings";
import { useFollowingsState } from "@/features/bilibili-followings/useFollowingsState";
import { useStore } from "@/store";
import { useUnreadUpMids } from "@/store/derives";
import { useActiveFollowedUps } from "@/store/followings";
import type { UpInfo } from "@/types";

import FollowUpsGrid from "./FollowUpsGrid";

type Props = {
  specialMids?: ReadonlySet<string>;
  onSetGroups?: (up: UpInfo) => void;
};

export default function AllUpList({ specialMids, onSetGroups }: Props) {
  const { livingUps } = useStore();
  const $followedUps = useActiveFollowedUps();
  const unreadMids = useUnreadUpMids();
  const { isValidating, mutate } = useFollowingsState();
  const orderedUps = orderFollowedUps($followedUps, livingUps, specialMids, unreadMids);

  return (
    <FollowUpsGrid
      ups={orderedUps}
      specialMids={specialMids}
      onSetGroups={onSetGroups}
      refreshing={isValidating}
      onRefresh={() => {
        void mutate().catch(() => {});
      }}
      emptyContent={
        <Text className="my-10 text-center text-base">暂无关注，请搜索你感兴趣的UP主添加</Text>
      }
      footer={
        $followedUps.length ? (
          <Text className="pb-3 text-center text-xs text-gray-500">到底了~</Text>
        ) : null
      }
    />
  );
}
