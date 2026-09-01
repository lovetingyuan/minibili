import { useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";

import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import request from "./fetcher";
import {
  fetchFollowingDynamicsPage,
  getFollowingDynamicsKey,
  getFollowingDynamicsListItems,
} from "./following-dynamics";
import type {
  FollowingDynamicsKeyLoader,
  FollowingDynamicsPage,
} from "./following-dynamics.types";

export function useFollowingDynamicItems() {
  const session = useBilibiliSessionState();
  const account =
    session.account && bilibiliSession.isCurrentAccount(session.account) ? session.account : null;
  const pending = useRef<Promise<FollowingDynamicsPage[] | undefined> | null>(null);
  const refreshingRef = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const swr = useSWRInfinite<FollowingDynamicsPage, Error, FollowingDynamicsKeyLoader>(
    (index, previous) => getFollowingDynamicsKey(account, index, previous),
    ([, mid, generation, page, offset]) =>
      fetchFollowingDynamicsPage(
        page,
        offset,
        request,
        () => bilibiliSession.isCurrentAccount({ mid, generation }),
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
  const pages = account ? (swr.data?.slice(0, swr.size) ?? []) : [];
  const lastPage = pages.at(-1);
  const isReachingEnd = Boolean(
    lastPage && (!lastPage.has_more || !lastPage.items.length || !lastPage.offset),
  );
  const isLoadingMore = Boolean(
    account && !swr.error && swr.size > pages.length && !isReachingEnd,
  );

  async function loadMore() {
    if (
      !account ||
      !bilibiliSession.isCurrentAccount(account) ||
      pending.current ||
      refreshingRef.current ||
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

  async function refresh() {
    if (!account || !bilibiliSession.isCurrentAccount(account) || refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      await pending.current?.catch(() => {});
      if (!bilibiliSession.isCurrentAccount(account)) return;
      await swr.setSize(1);
      if (!bilibiliSession.isCurrentAccount(account)) return;
      await swr.mutate();
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
