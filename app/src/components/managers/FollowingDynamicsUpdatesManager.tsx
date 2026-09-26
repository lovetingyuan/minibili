import React from "react";
import { useSWRConfig } from "swr";

import { getFollowingDynamicsUpdateCount } from "@/api/following-dynamics";
import { getFollowingDynamicsNavKey } from "@/api/useFollowingDynamicsNavUpdates";
import { useFollowingDynamicsUpdates } from "@/api/useFollowingDynamicsUpdates";
import { bilibiliSession } from "@/features/bilibili-session/session";
import { useBilibiliSessionState } from "@/features/bilibili-session/useBilibiliSession";
import { getStoreMethods } from "@/store";

function FollowingDynamicsUpdatesManager() {
  const { data } = useFollowingDynamicsUpdates();
  const { mutate } = useSWRConfig();
  const session = useBilibiliSessionState();
  const account =
    session.account && bilibiliSession.isCurrentAccount(session.account) ? session.account : null;
  // 同一次响应只触发一次 nav 刷新，避免后续重渲染反复请求
  const handledDataRef = React.useRef<unknown>(null);

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

    const count = getFollowingDynamicsUpdateCount(data);
    methods.set$followingDynamicsUpdateMap({
      ...updateMap,
      [mid]: {
        baseline: current.baseline,
        count,
      },
    });
    methods.setFollowingDynamicsUpdateCount(count);

    // update 接口只告诉有多少条新动态，不知道是哪些 UP：
    // 发现新动态后补拉一次 feed/nav，让小红点与「关注」角标跟「动态」角标同一轮对齐
    if (count > 0 && handledDataRef.current !== data) {
      handledDataRef.current = data;
      const navKey = getFollowingDynamicsNavKey(account);
      if (navKey) {
        void mutate(navKey).catch(() => {});
      }
    }
  }, [account, data, mutate]);

  return null;
}

export default FollowingDynamicsUpdatesManager;
