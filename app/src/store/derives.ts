import {
  countFollowingDynamicsUnreadUps,
  isFollowingDynamicsUpUnread,
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

function useFollowingDynamicsUnreadState() {
  const { account, control } = useBilibiliSessionState();
  const { $followingDynamicsReadMap, followingDynamicsNavReadyAccount } = useStore();
  const current =
    control.phase === "ready" && account && bilibiliSession.isCurrentAccount(account)
      ? account
      : null;
  const ready =
    current &&
    followingDynamicsNavReadyAccount?.mid === current.mid &&
    followingDynamicsNavReadyAccount.generation === current.generation;
  return ready ? $followingDynamicsReadMap[current.mid] : undefined;
}

/** 当前账号是否有一条该 UP 的未读动态，用于关注列表头像右上角的小红点 */
export function useUpHasNewDynamic(mid: UpInfo["mid"]) {
  const state = useFollowingDynamicsUnreadState();
  return isFollowingDynamicsUpUnread(state?.[String(mid)]);
}

/** 当前账号有未读动态的 UP mid 集合，用于把带小红点的 UP 排到关注列表最前面 */
export function useUnreadUpMids(): ReadonlySet<string> {
  const state = useFollowingDynamicsUnreadState();
  return new Set(
    state
      ? Object.entries(state)
          .filter(([, item]) => isFollowingDynamicsUpUnread(item))
          .map(([mid]) => mid)
      : [],
  );
}

/** 「关注」tab 角标：当前关注列表里有未读更新的 UP 数量 */
export function useUnreadFollowedUpCount() {
  const $followedUps = useActiveFollowedUps();
  const state = useFollowingDynamicsUnreadState();
  return countFollowingDynamicsUnreadUps(state, new Set($followedUps.map((up) => String(up.mid))));
}
