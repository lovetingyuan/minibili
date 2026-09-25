import React from "react";

import type { UsePullToRefreshResult } from "./usePullToRefresh.type";

/**
 * 把「用户主动下拉刷新」和「后台自动重新校验」区分开。
 *
 * SWR 在回到前台、网络重连、或别处 mutate 同一个 key 时会自己重新校验，
 * 直接把 isValidating 当成 refreshing 会让下拉刷新图标无缘无故冒出来。
 * 这里只在用户手势触发的那次刷新期间显示刷新图标。
 */
export function usePullToRefresh(refresh: () => void | Promise<unknown>): UsePullToRefreshResult {
  const [refreshing, setRefreshing] = React.useState(false);
  const refreshingRef = React.useRef(false);

  function onRefresh() {
    if (refreshingRef.current) {
      return;
    }
    refreshingRef.current = true;
    setRefreshing(true);
    void (async () => {
      try {
        await refresh();
      } catch {
        // 刷新失败由数据层的 error 状态或 toast 反馈，这里只负责收起刷新图标
      } finally {
        refreshingRef.current = false;
        setRefreshing(false);
      }
    })();
  }

  return { refreshing, onRefresh };
}
