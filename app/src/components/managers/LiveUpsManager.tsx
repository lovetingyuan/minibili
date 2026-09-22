import React from "react";

import { useLiveUps } from "@/api/live-ups";
import { useStore } from "@/store";
import type { UpInfo } from "@/types";

function LiveUpsManager() {
  const { data, mutate } = useLiveUps();
  const { $followedUps, setLivingUps } = useStore();
  const previousFollowedUpsRef = React.useRef<UpInfo[]>($followedUps);

  // 直播中的 UP 由关注列表决定，关注列表变化后本地缓存的直播数据已过期。
  React.useEffect(() => {
    const previousFollowedUps = previousFollowedUpsRef.current;
    previousFollowedUpsRef.current = $followedUps;
    if (previousFollowedUps === $followedUps) {
      return;
    }
    void mutate().catch(() => {});
  }, [$followedUps, mutate]);

  React.useEffect(() => {
    // B站返回的直播列表可能落后于最新的关注关系（取消关注后仍留在列表里），
    // 以本地关注列表为准，取关后立即收起直播角标。
    const followedMids = new Set($followedUps.map((up) => String(up.mid)));
    const livingUps: Record<string, string> = {};
    for (const item of data?.items ?? []) {
      if (followedMids.has(item.mid)) {
        livingUps[item.mid] = item.link;
      }
    }
    setLivingUps(livingUps);
  }, [$followedUps, data, setLivingUps]);

  return null;
}

export default LiveUpsManager;
