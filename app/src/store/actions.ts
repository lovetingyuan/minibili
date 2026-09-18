import React from "react";

import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import { useStore } from ".";

export function useMarkHotSearchViewed() {
  const { set$watchedHotSearch, get$watchedHotSearch } = useStore();
  return (name: string) => {
    const viewed = { ...get$watchedHotSearch() };
    viewed[name] = Date.now();
    let list = Object.entries(viewed);
    if (list.length > 100) {
      list = list.sort((a, b) => b[1] - a[1]).slice(0, 100);
      const newViewed: typeof viewed = {};
      for (const [k, t] of list) {
        newViewed[k] = t;
      }
      set$watchedHotSearch(newViewed);
    } else {
      set$watchedHotSearch(viewed);
    }
  };
}

/**
 * 打开某个 UP 的动态页时清除他的未读小红点。
 * 同时把读到的动态 id 记进本次会话的已读表，避免在途的轮询响应把红点又加回来。
 */
export function useMarkFollowingDynamicsRead(mid: string | number | null | undefined) {
  const { account } = useBilibiliSessionState();
  const {
    get$followingDynamicsUnreadMap,
    set$followingDynamicsUnreadMap,
    getFollowingDynamicsReadIds,
    setFollowingDynamicsReadIds,
  } = useStore();

  React.useEffect(() => {
    if (mid == null) {
      return;
    }
    const current =
      account &&
      bilibiliSession.isCurrentAccount(account) &&
      bilibiliSession.getSnapshot().phase === "ready"
        ? account
        : null;
    if (!current) {
      return;
    }
    const upMid = String(mid);
    const map = get$followingDynamicsUnreadMap();
    const state = map[current.mid];
    const idStr = state?.unread[upMid];
    if (!state || !idStr) {
      return;
    }
    const unread = { ...state.unread };
    delete unread[upMid];
    set$followingDynamicsUnreadMap({ ...map, [current.mid]: { baseline: state.baseline, unread } });

    const readIds = getFollowingDynamicsReadIds();
    setFollowingDynamicsReadIds({
      ...readIds,
      [current.mid]: { ...readIds[current.mid], [upMid]: idStr },
    });
  }, [
    account,
    get$followingDynamicsUnreadMap,
    getFollowingDynamicsReadIds,
    mid,
    set$followingDynamicsUnreadMap,
    setFollowingDynamicsReadIds,
  ]);
}
