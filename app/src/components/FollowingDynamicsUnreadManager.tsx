import React from "react";

import {
  isSameFollowingDynamicsNavState,
  mergeFollowingDynamicsNavUnread,
} from "@/api/following-dynamics";
import { useFollowingDynamicsNavUpdates } from "@/api/useFollowingDynamicsNavUpdates";
import { bilibiliSession } from "@/features/bilibili-session/session";
import { useBilibiliSessionState } from "@/features/bilibili-session/useBilibiliSession";
import { getStoreMethods } from "@/store";

/**
 * 轮询 feed/nav，把「最近有更新的 UP」合并进本地未读表。
 * 小红点与「关注」tab 角标都读这份状态；「动态」tab 的未读数走另一条链路。
 */
function FollowingDynamicsUnreadManager() {
  const { data } = useFollowingDynamicsNavUpdates();
  const session = useBilibiliSessionState();
  const account =
    session.account && bilibiliSession.isCurrentAccount(session.account) ? session.account : null;

  React.useEffect(() => {
    if (!account || !data) {
      return;
    }
    const methods = getStoreMethods();
    const map = methods.get$followingDynamicsUnreadMap();
    const followedMids =
      methods.getFollowingsGeneration() === account.generation
        ? new Set(methods.get$followedUps().map((up) => String(up.mid)))
        : undefined;
    const current = map[account.mid];
    const next = mergeFollowingDynamicsNavUnread({
      state: current,
      batch: data,
      readIds: methods.getFollowingDynamicsReadIds()[account.mid],
      followedMids,
    });
    if (isSameFollowingDynamicsNavState(current, next)) {
      return;
    }
    methods.set$followingDynamicsUnreadMap({ ...map, [account.mid]: next });
  }, [account, data]);

  return null;
}

export default FollowingDynamicsUnreadManager;
