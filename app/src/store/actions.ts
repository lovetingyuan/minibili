import React from "react";

import {
  markFollowingDynamicsUpRead,
  markFollowingDynamicsUpUnread,
} from "../api/following-dynamics";
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
 * 把持久化 readId 推进到当前 latestId，旧的在途响应无法把红点加回来。
 */
export function useMarkFollowingDynamicsRead(mid: string | number | null | undefined) {
  const { account } = useBilibiliSessionState();
  const { set$followingDynamicsReadMap } = useStore();

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
    set$followingDynamicsReadMap((map) => {
      const state = map[current.mid];
      const next = markFollowingDynamicsUpRead(state, upMid);
      if (!next || next === state) {
        return map;
      }
      return {
        ...map,
        [current.mid]: next,
      };
    });
  }, [account, mid, set$followingDynamicsReadMap]);
}

/**
 * 关注列表长按头像「标记未读」：让某个 UP 的小红点重新出现。
 * 状态写入持久化的 readMap，打开他的动态页会被 markFollowingDynamicsUpRead 清掉。
 */
export function useMarkFollowingDynamicsUnread() {
  const { account } = useBilibiliSessionState();
  const { set$followingDynamicsReadMap } = useStore();

  return (mid: string | number) => {
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
    set$followingDynamicsReadMap((map) => {
      const state = map[current.mid];
      const next = markFollowingDynamicsUpUnread(state, upMid);
      if (!next || next === state) {
        return map;
      }
      return {
        ...map,
        [current.mid]: next,
      };
    });
  };
}
