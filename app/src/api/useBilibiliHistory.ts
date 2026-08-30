import { useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";

import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import fetcher from "./fetcher";
import { fetchBilibiliHistory, getHistoryKey, getHistoryListItems } from "./history";
import type { HistoryKeyLoader, HistoryPage } from "./history.types";

export function useBilibiliHistory() {
  const session = useBilibiliSessionState();
  const account =
    session.account && bilibiliSession.isCurrentAccount(session.account) ? session.account : null;
  const pending = useRef<Promise<HistoryPage[] | undefined> | null>(null);
  const refreshingRef = useRef(false);
  const refreshAttempt = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const response = useSWRInfinite<HistoryPage, Error, HistoryKeyLoader>(
    (index, previous) => getHistoryKey(account, index, previous),
    ([, mid, generation, max, view_at, business, chainId]) =>
      fetchBilibiliHistory(
        { max, view_at, business },
        fetcher,
        () => bilibiliSession.isCurrentAccount({ mid, generation }),
        chainId,
      ),
    {
      keepPreviousData: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateFirstPage: false,
      persistSize: false,
      parallel: false,
      shouldRetryOnError: false,
    },
  );
  const { data, size, setSize, mutate, error, isLoading, isValidating } = response;
  const pages = account ? (data?.slice(0, size) ?? []) : [];
  const hasMore = pages.at(-1)?.hasMore ?? false;
  const isLoadingMore = isLoading || (!error && size > pages.length && hasMore);

  async function loadMore() {
    if (
      !account ||
      !bilibiliSession.isCurrentAccount(account) ||
      pending.current ||
      refreshingRef.current ||
      isValidating ||
      isLoadingMore ||
      error ||
      !hasMore
    )
      return;
    refreshAttempt.current = false;
    const task = setSize((value) => value + 1);
    pending.current = task;
    try {
      await task;
    } finally {
      pending.current = null;
    }
  }

  async function refresh() {
    if (!account || !bilibiliSession.isCurrentAccount(account) || refreshingRef.current) return;
    refreshingRef.current = true;
    refreshAttempt.current = true;
    setRefreshing(true);
    try {
      // 等待正在追加的页面，避免它在刷新后重新扩展列表。
      await pending.current?.catch(() => {});
      if (!bilibiliSession.isCurrentAccount(account)) return;
      await setSize(1);
      if (!bilibiliSession.isCurrentAccount(account)) return;
      await mutate();
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }

  async function retry() {
    if (
      !account ||
      !bilibiliSession.isCurrentAccount(account) ||
      pending.current ||
      refreshingRef.current ||
      isValidating
    )
      return;
    if (refreshAttempt.current) return refresh();
    // 续页失败只重取缺失页，保留之前已成功获取的游标链。
    const task = mutate(undefined, { revalidate: (page) => !page });
    pending.current = task;
    try {
      await task;
    } finally {
      pending.current = null;
    }
  }

  return {
    items: getHistoryListItems(pages),
    hasMore,
    isLoading,
    isValidating,
    isLoadingMore,
    error,
    refreshing,
    loadMore,
    refresh,
    retry,
  };
}
