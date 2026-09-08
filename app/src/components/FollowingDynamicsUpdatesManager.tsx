import React from "react";

import { getFollowingDynamicsNavState } from "@/api/following-dynamics";
import { useFollowingDynamicsUpdates } from "@/api/useFollowingDynamicsUpdates";
import { bilibiliSession } from "@/features/bilibili-session/session";
import { useBilibiliSessionState } from "@/features/bilibili-session/useBilibiliSession";
import { getStoreMethods } from "@/store";

function FollowingDynamicsUpdatesManager() {
  const { data } = useFollowingDynamicsUpdates();
  const session = useBilibiliSessionState();
  const account =
    session.account && bilibiliSession.isCurrentAccount(session.account) ? session.account : null;

  React.useEffect(() => {
    const methods = getStoreMethods();
    if (!account) {
      methods.setFollowingDynamicsUpdateCount(0);
      return;
    }

    const mid = account.mid;
    const updateMap = methods.get$followingDynamicsUpdateMap();
    const current = updateMap[mid];
    if (!current?.baseline) {
      methods.setFollowingDynamicsUpdateCount(0);
      return;
    }
    if (!data) {
      return;
    }

    const next = getFollowingDynamicsNavState(current?.baseline, data);
    methods.set$followingDynamicsUpdateMap({
      ...updateMap,
      [mid]: {
        ...next,
      },
    });
    methods.setFollowingDynamicsUpdateCount(next.count);
  }, [account, data]);

  return null;
}

export default FollowingDynamicsUpdatesManager;
