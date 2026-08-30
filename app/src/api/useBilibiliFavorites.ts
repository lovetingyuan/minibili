import { useEffect, useRef } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import fetcher from "./fetcher";
import {
  fetchBilibiliFavoriteFolders,
  fetchBilibiliFavoriteResources,
  getFavoriteFoldersKey,
  getFavoriteListItems,
  getFavoriteResourcesKey,
} from "./favorites";
import type { FavoriteResources, FavoriteResourcesKeyLoader } from "./favorites.types";

const favoriteOptions = {
  keepPreviousData: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: (error: Error) => !(error instanceof BilibiliSessionChangedError),
  errorRetryCount: 2,
};

function useFavoriteAccount() {
  const { account } = useBilibiliSessionState();
  return account && bilibiliSession.isCurrentAccount(account) ? account : null;
}

export function useBilibiliFavoriteFolders() {
  const account = useFavoriteAccount();
  const response = useSWR(
    account ? getFavoriteFoldersKey(account) : null,
    ([, mid, generation]) => {
      const current = { mid, generation };
      return fetchBilibiliFavoriteFolders(current, fetcher, () =>
        bilibiliSession.isCurrentAccount(current),
      );
    },
    favoriteOptions,
  );
  return { ...response, data: account ? response.data : undefined };
}

export function useBilibiliFavoriteResources(folderId?: number) {
  const account = useFavoriteAccount();
  const pending = useRef(false);
  const response = useSWRInfinite<FavoriteResources, Error, FavoriteResourcesKeyLoader>(
    (index, previous: FavoriteResources | null) =>
      getFavoriteResourcesKey(account, folderId, index, previous),
    ([, mid, generation, mediaId, page]) =>
      fetchBilibiliFavoriteResources(mediaId, page, fetcher, () =>
        bilibiliSession.isCurrentAccount({ mid, generation }),
      ),
    { ...favoriteOptions, revalidateFirstPage: false, persistSize: false },
  );
  const { data, size, setSize, mutate, isLoading, isValidating, error } = response;

  // SWR 会缓存每个收藏夹的 size；切换时保留页数据，但从第一页重新展示。
  useEffect(() => {
    void setSize(1).catch(() => {});
  }, [account?.mid, account?.generation, folderId, setSize]);

  const pages = account && folderId ? (data?.slice(0, size) ?? []) : [];
  const hasMore = pages.at(-1)?.has_more ?? false;
  const isLoadingMore = isLoading || (!error && size > pages.length && hasMore);

  async function loadMore() {
    if (
      !account ||
      !folderId ||
      pending.current ||
      isValidating ||
      isLoadingMore ||
      error ||
      !hasMore
    ) {
      return;
    }
    pending.current = true;
    try {
      await setSize((value) => value + 1);
    } finally {
      pending.current = false;
    }
  }

  async function refresh() {
    await setSize(1);
    await mutate();
  }

  return {
    ...response,
    items: getFavoriteListItems(pages),
    hasMore,
    isLoadingMore,
    loadMore,
    refresh,
  };
}
