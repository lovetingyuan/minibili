import React from "react";

import {
  isSameFollowingDynamicsReadState,
  mergeFollowingDynamicsReadState,
} from "@/api/following-dynamics";
import { useFollowingDynamicsNavUpdates } from "@/api/useFollowingDynamicsNavUpdates";
import { bilibiliSession } from "@/features/bilibili-session/session";
import { useBilibiliSessionState } from "@/features/bilibili-session/useBilibiliSession";
import { getStoreMethods, useStore } from "@/store";

/**
 * 轮询 feed/nav，把「最近有更新的 UP」合并进本地未读表。
 * 小红点与「关注」tab 角标都读这份状态；「动态」tab 的未读数走另一条链路。
 */
function FollowingDynamicsUnreadManager() {
  const { data } = useFollowingDynamicsNavUpdates();
  const session = useBilibiliSessionState();
  const { initialed } = useStore();
  const account =
    initialed &&
    session.control.phase === "ready" &&
    session.account &&
    bilibiliSession.isCurrentAccount(session.account)
      ? session.account
      : null;

  React.useEffect(() => {
    const methods = getStoreMethods();
    if (!account) {
      methods.setFollowingDynamicsNavReadyAccount(null);
      return;
    }
    if (!data || !bilibiliSession.isCurrentAccount(account)) {
      return;
    }
    const followedMids =
      methods.getFollowingsGeneration() === account.generation
        ? new Set(methods.get$followedUps().map((up) => String(up.mid)))
        : undefined;
    methods.set$followingDynamicsReadMap((map) => {
      const current = map[account.mid];
      const next = mergeFollowingDynamicsReadState({ state: current, batch: data, followedMids });
      if (isSameFollowingDynamicsReadState(current, next)) {
        return map;
      }
      return { ...map, [account.mid]: next };
    });
    methods.setFollowingDynamicsNavReadyAccount({
      mid: account.mid,
      generation: account.generation,
    });
  }, [account, data]);

  return null;
}

export default FollowingDynamicsUnreadManager;
