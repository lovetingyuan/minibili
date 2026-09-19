import { useSyncExternalStore } from "react";

import {
  countFollowingDynamicsUnreadUps,
  isNewerFollowingDynamicId,
} from "@/api/following-dynamics";
import { bilibiliSession } from "@/features/bilibili-session/session";
import { useBilibiliSessionState } from "@/features/bilibili-session/useBilibiliSession";
import type { UpInfo } from "@/types";

import { useStore } from ".";
import { useActiveFollowedUps } from "./followings";

export const useFollowedUpsMap = () => {
  const $followedUps = useActiveFollowedUps();
  const ups: Record<string, UpInfo> = {};
  for (const up of $followedUps) {
    ups[up.mid] = up;
  }
  return ups;
};

/** 当前账号是否有一条该 UP 的未读动态，用于关注列表头像右上角的小红点 */
export function useUpHasNewDynamic(mid: UpInfo["mid"]) {
  const control = useSyncExternalStore(bilibiliSession.subscribe, bilibiliSession.getSnapshot);
  const { account } = useBilibiliSessionState();
  const { $followingDynamicsReadMap, followingDynamicsNavReadyAccount } = useStore();
  const current =
    control.phase === "ready" && account && bilibiliSession.isCurrentAccount(account)
      ? account
      : null;
  const ready =
    current &&
    followingDynamicsNavReadyAccount?.mid === current.mid &&
    followingDynamicsNavReadyAccount.generation === current.generation;
  if (!ready) {
    return false;
  }
  const item = $followingDynamicsReadMap[current.mid]?.[String(mid)];
  return Boolean(item && isNewerFollowingDynamicId(item.latestId, item.readId));
}

/** 当前账号有未读动态的 UP mid 集合，用于把带小红点的 UP 排到关注列表最前面 */
export function useUnreadUpMids(): ReadonlySet<string> {
  const control = useSyncExternalStore(bilibiliSession.subscribe, bilibiliSession.getSnapshot);
  const { account } = useBilibiliSessionState();
  const { $followingDynamicsReadMap, followingDynamicsNavReadyAccount } = useStore();
  const current =
    control.phase === "ready" && account && bilibiliSession.isCurrentAccount(account)
      ? account
      : null;
  const ready =
    current &&
    followingDynamicsNavReadyAccount?.mid === current.mid &&
    followingDynamicsNavReadyAccount.generation === current.generation;
  if (!ready) {
    return new Set();
  }
  const state = $followingDynamicsReadMap[current.mid];
  return new Set(
    state
      ? Object.entries(state)
          .filter(([, item]) => isNewerFollowingDynamicId(item.latestId, item.readId))
          .map(([mid]) => mid)
      : [],
  );
}

/** 「关注」tab 角标：当前关注列表里有未读更新的 UP 数量 */
export function useUnreadFollowedUpCount() {
  const $followedUps = useActiveFollowedUps();
  const control = useSyncExternalStore(bilibiliSession.subscribe, bilibiliSession.getSnapshot);
  const { account } = useBilibiliSessionState();
  const { $followingDynamicsReadMap, followingDynamicsNavReadyAccount } = useStore();
  const current =
    control.phase === "ready" && account && bilibiliSession.isCurrentAccount(account)
      ? account
      : null;
  const ready =
    current &&
    followingDynamicsNavReadyAccount?.mid === current.mid &&
    followingDynamicsNavReadyAccount.generation === current.generation;
  if (!ready) {
    return 0;
  }
  const state = $followingDynamicsReadMap[current.mid];
  return countFollowingDynamicsUnreadUps(state, new Set($followedUps.map((up) => String(up.mid))));
}
