import React from "react";

import { useLiveUps } from "@/api/live-ups";
import { getPollResultTime } from "@/api/poll-result-time";
import {
  applyLiveResult,
  getForegroundPollOwner,
  isForegroundAccountCurrent,
} from "@/features/background-updates/results";
import { saveLiveResult } from "@/features/background-updates/storage";
import { useBackgroundUpdates } from "@/features/background-updates/useBackgroundUpdates";
import { useBilibiliSessionState } from "@/features/bilibili-session/useBilibiliSession";
import { useStore } from "@/store";
import type { UpInfo } from "@/types";

function LiveUpsManager() {
  useBackgroundUpdates();
  const { data, mutate } = useLiveUps();
  const { account } = useBilibiliSessionState();
  const { $followedUps, followingsGeneration, setLivingUps } = useStore();
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
    if (!account || !isForegroundAccountCurrent(account)) {
      setLivingUps({});
      return;
    }
    if (!data) {
      return;
    }
    const owner = getForegroundPollOwner(account);
    void saveLiveResult(owner, data, getPollResultTime(data))
      .then((result) => {
        if (result) {
          applyLiveResult(account, result.data, result.at);
        }
      })
      .catch(() => {
        // 本地缓存写入失败时前台仍展示本轮接口结果。
        applyLiveResult(account, data, getPollResultTime(data));
      });
  }, [$followedUps, followingsGeneration, account, data, setLivingUps]);

  return null;
}

export default LiveUpsManager;
