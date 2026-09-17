import React from "react";
import { Image, View } from "react-native";

import { Text } from "@/components/styled/rneui";
import { orderFollowedUps } from "@/features/bilibili-followings/order-followings";
import { useFollowingsState } from "@/features/bilibili-followings/useFollowingsState";
import { useStore } from "@/store";
import { useActiveFollowedUps } from "@/store/followings";
import type { UpInfo } from "@/types";

import FollowUpsGrid from "./FollowUpsGrid";

const tvL = require("../../../assets/tv-l.png");
const tvR = require("../../../assets/tv-r.png");

function TvImg() {
  const [tvImg, setTvImg] = React.useState(false);
  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setTvImg((v) => !v);
    }, 700);
    return () => {
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, []);

  return (
    <Image source={tvImg ? tvL : tvR} className="mt-12 aspect-square h-auto w-35 self-center" />
  );
}

type Props = {
  specialMids?: ReadonlySet<string>;
  onSetGroups?: (up: UpInfo) => void;
};

export default function AllUpList({ specialMids, onSetGroups }: Props) {
  const { livingUps } = useStore();
  const $followedUps = useActiveFollowedUps();
  const { isValidating, mutate } = useFollowingsState();
  const orderedUps = orderFollowedUps($followedUps, livingUps, specialMids);

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
        <View>
          <TvImg />
          <Text className="my-10 text-center text-base">暂无关注，请搜索你感兴趣的UP主添加</Text>
        </View>
      }
      footer={
        $followedUps.length ? (
          <Text className="pb-3 text-center text-xs text-gray-500">到底了~</Text>
        ) : null
      }
    />
  );
}
