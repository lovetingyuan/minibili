import { useEffect, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";

import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import { enqueueToast } from "../features/toast";
import { getStoreMethods } from "../store";
import request from "./fetcher";
import {
  fetchFollowingDynamicsPage,
  getFollowingDynamicsLatestId,
  getFollowingDynamicsKey,
  getFollowingDynamicsListItems,
} from "./following-dynamics";
import type { FollowingDynamicsKeyLoader, FollowingDynamicsPage } from "./following-dynamics.types";

export function useFollowingDynamicItems() {
  const session = useBilibiliSessionState();
  const account =
    session.account && bilibiliSession.isCurrentAccount(session.account) ? session.account : null;
  const pending = useRef<Promise<FollowingDynamicsPage[] | undefined> | null>(null);
  const refreshTask = useRef<Promise<boolean> | null>(null);
  const refreshingAccount = useRef<typeof account>(null);
  const [refreshing, setRefreshing] = useState(false);
  const swr = useSWRInfinite<FollowingDynamicsPage, Error, FollowingDynamicsKeyLoader>(
    (index, previous) =>
      index > 0 && refreshingAccount.current
        ? null
        : getFollowingDynamicsKey(account, index, previous),
    ([, mid, generation, page, offset]) =>
      fetchFollowingDynamicsPage(page, offset, request, () =>
        bilibiliSession.isCurrentAccount({ mid, generation }),
      ),
    {
      keepPreviousData: false,
      revalidateOnMount: true,
      // 追加分页时沿用当前游标，进入页面时重新请求。
      revalidateFirstPage: false,
      persistSize: false,
      parallel: false,
      shouldRetryOnError: false,
      onSuccess: () => {
        if (
          refreshingAccount.current &&
          bilibiliSession.isCurrentAccount(refreshingAccount.current)
        ) {
          refreshingAccount.current = null;
          enqueueToast("刷新成功", false);
        }
      },
    },
  );
  const pages = account ? (swr.data?.slice(0, swr.size) ?? []) : [];
  const latestId = getFollowingDynamicsLatestId(pages[0]);

  useEffect(() => {
    if (!account || latestId == null) {
      return;
    }
    const methods = getStoreMethods();
    const updateMap = methods.get$followingDynamicsUpdateMap();
    methods.set$followingDynamicsUpdateMap({
      ...updateMap,
      [account.mid]: {
        baseline: latestId,
        count: 0,
        readAt: Date.now(),
      },
    });
    methods.setFollowingDynamicsUpdateCount(0);
  }, [account, latestId]);

  const lastPage = pages.at(-1);
  const isReachingEnd = Boolean(
    lastPage && (!lastPage.has_more || !lastPage.items.length || !lastPage.offset),
  );
  const isLoadingMore = Boolean(account && !swr.error && swr.size > pages.length && !isReachingEnd);

  async function loadMore() {
    if (
      !account ||
      !bilibiliSession.isCurrentAccount(account) ||
      pending.current ||
      refreshTask.current ||
      swr.isValidating ||
      isLoadingMore ||
      swr.error ||
      isReachingEnd
    ) {
      return;
    }
    const task = swr.setSize((size) => size + 1);
    pending.current = task;
    try {
      await task;
    } finally {
      pending.current = null;
    }
  }

  function refresh(): Promise<boolean> {
    if (!account || !bilibiliSession.isCurrentAccount(account)) {
      return Promise.resolve(false);
    }
    if (refreshTask.current) {
      return refreshTask.current;
    }

    setRefreshing(true);
    const task = (async () => {
      try {
        await pending.current?.catch(() => {});
        if (!bilibiliSession.isCurrentAccount(account)) {
          return false;
        }
        // 刷新期间只请求首页，成功后再重置页数，避免提前截短列表。
        refreshingAccount.current = account;
        await swr.mutate();
        // mutate 失败时也可能返回缓存，只有 onSuccess 会清除这次刷新的标记。
        if (refreshingAccount.current !== null || !bilibiliSession.isCurrentAccount(account)) {
          return false;
        }
        await swr.setSize(1);
        return bilibiliSession.isCurrentAccount(account);
      } finally {
        refreshingAccount.current = null;
        refreshTask.current = null;
        setRefreshing(false);
      }
    })();
    refreshTask.current = task;
    return task;
  }

  async function retry() {
    if (
      !account ||
      !bilibiliSession.isCurrentAccount(account) ||
      pending.current ||
      refreshTask.current ||
      swr.isValidating
    ) {
      return;
    }
    const task = swr.mutate(undefined, { revalidate: (page) => !page });
    pending.current = task;
    try {
      await task;
    } finally {
      pending.current = null;
    }
  }

  return {
    list: getFollowingDynamicsListItems(pages),
    latestId,
    error: swr.error,
    isLoading: swr.isLoading,
    isValidating: swr.isValidating,
    isRefreshing: refreshing,
    isLoadingMore,
    isReachingEnd,
    loadMore,
    refresh,
    retry,
  };
}
