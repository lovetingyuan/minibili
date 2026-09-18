import { useEffect, useRef } from "react";
import useSWR, { useSWRConfig } from "swr";
import useSWRInfinite from "swr/infinite";

import { clearFavoriteResourcePages } from "../features/bilibili-favorites/mutations";
import {
  FavoriteResourcesChangedError,
  getFavoriteResourceRevision,
  invalidateFavoriteResourceRequests,
} from "../features/bilibili-favorites/resource-revisions";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import fetcher from "./fetcher";
import {
  createBilibiliFavoriteFolder,
  deleteBilibiliFavoriteFolder,
  FavoriteFolderResultUnknownError,
  fetchBilibiliFavoriteFolders,
  fetchBilibiliFavoriteResources,
  getFavoriteFoldersKey,
  getFavoriteListItems,
  getFavoriteResourcesKey,
} from "./favorites";
import type {
  FavoriteAccount,
  FavoriteResources,
  FavoriteResourcesKeyLoader,
} from "./favorites.types";
import { getBilibiliLoginCookie } from "./get-cookie";
import type { VideoFavoriteChange } from "./video-favorites.types";

const favoriteOptions = {
  keepPreviousData: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: (error: Error) =>
    !(
      error instanceof BilibiliSessionChangedError || error instanceof FavoriteResourcesChangedError
    ),
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
  const { mutate: mutateCache } = useSWRConfig();
  const pending = useRef(false);
  const response = useSWRInfinite<FavoriteResources, Error, FavoriteResourcesKeyLoader>(
    (index, previous: FavoriteResources | null) =>
      getFavoriteResourcesKey(account, folderId, index, previous),
    async ([, mid, generation, mediaId, page]) => {
      const current = { mid, generation };
      const revision = getFavoriteResourceRevision(mutateCache, current, mediaId);
      const data = await fetchBilibiliFavoriteResources(mediaId, page, fetcher, () =>
        bilibiliSession.isCurrentAccount(current),
      );
      // SWR Infinite 对单页缓存的写入不受聚合 key 的竞态保护，必须在返回数据前拦截。
      if (getFavoriteResourceRevision(mutateCache, current, mediaId) !== revision) {
        throw new FavoriteResourcesChangedError();
      }
      return data;
    },
    { ...favoriteOptions, revalidateFirstPage: true, persistSize: false },
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

  async function refreshAfterChange(change: VideoFavoriteChange) {
    const removedFromCurrentFolder = Boolean(
      account &&
      folderId &&
      change.initialIds.includes(folderId) &&
      !change.selectedIds.includes(folderId),
    );
    try {
      if (account && folderId && removedFromCurrentFolder) {
        invalidateFavoriteResourceRequests(mutateCache, account, [folderId]);
        await clearFavoriteResourcePages(account, new Set([folderId]), mutateCache);
      }
      await refresh();
    } finally {
      if (removedFromCurrentFolder) {
        await mutate(
          (current) =>
            current?.map((page) => ({
              ...page,
              medias: page.medias.filter(
                (media) => media.type !== 2 || String(media.id) !== change.video.aid,
              ),
            })),
          { revalidate: false },
        );
      }
    }
  }

  return {
    ...response,
    items: getFavoriteListItems(pages),
    hasMore,
    isLoadingMore,
    loadMore,
    refresh,
    refreshAfterChange,
  };
}

const folderMutationDependencies = {
  readCookie: getBilibiliLoginCookie,
  isCurrentAccount: (account: FavoriteAccount) => bilibiliSession.isCurrentAccount(account),
};

/**
 * 收藏夹的新建与删除。写操作成功后统一刷新收藏夹列表，
 * 结果不确定时先刷新再抛错，避免用户重复提交。
 */
export function useBilibiliFavoriteFolderActions() {
  const account = useFavoriteAccount();
  const { mutate: mutateCache } = useSWRConfig();
  const pending = useRef(new Set<string>());

  function assertAccount() {
    if (!account || !bilibiliSession.isCurrentAccount(account)) {
      throw new BilibiliSessionChangedError();
    }
    return account;
  }

  // 刷新失败不影响已经成功的写操作，页面仍可下拉重试
  function refreshFolders(current: FavoriteAccount) {
    return mutateCache(getFavoriteFoldersKey(current)).catch(() => {});
  }

  async function run<T>(key: string, work: (current: FavoriteAccount) => Promise<T>) {
    const current = assertAccount();
    const pendingKey = `${current.mid}:${current.generation}:${key}`;
    if (pending.current.has(pendingKey)) {
      throw new Error("操作正在进行，请稍候");
    }
    pending.current.add(pendingKey);
    try {
      return await work(current);
    } finally {
      pending.current.delete(pendingKey);
    }
  }

  function createFolder(options: { title: string; privacy: 0 | 1 }) {
    return run("create", async (current) => {
      try {
        const folder = await createBilibiliFavoriteFolder(
          { account: current, ...options },
          folderMutationDependencies,
        );
        await refreshFolders(current);
        return folder;
      } catch (cause) {
        if (!(cause instanceof FavoriteFolderResultUnknownError)) {
          throw cause;
        }
        await refreshFolders(current);
        throw new FavoriteFolderResultUnknownError(
          `${cause.message}，已刷新收藏夹列表，请确认结果后再操作`,
        );
      }
    });
  }

  function deleteFolder(folderId: number) {
    return run(`delete:${folderId}`, async (current) => {
      try {
        await deleteBilibiliFavoriteFolder(
          { account: current, folderId },
          folderMutationDependencies,
        );
      } catch (cause) {
        if (!(cause instanceof FavoriteFolderResultUnknownError)) {
          throw cause;
        }
        await refreshFolders(current);
        throw new FavoriteFolderResultUnknownError(
          `${cause.message}，已刷新收藏夹列表，请确认结果后再操作`,
        );
      }
      // 已删除的收藏夹不应再缓存内容页，也不能让在途请求写回旧数据
      invalidateFavoriteResourceRequests(mutateCache, current, [folderId]);
      await clearFavoriteResourcePages(current, new Set([folderId]), mutateCache).catch(() => {});
      await refreshFolders(current);
    });
  }

  return { createFolder, deleteFolder };
}
