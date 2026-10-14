import { useEffect, useRef } from "react";
import useSWR, { unstable_serialize, useSWRConfig } from "swr";
import useSWRInfinite from "swr/infinite";

import { clearFavoriteResourcePages } from "../features/bilibili-favorites/mutations";
import {
  FavoriteResourcesChangedError,
  getFavoriteResourceRevision,
  getFavoriteResourceState,
  invalidateFavoriteResourceRequests,
} from "../features/bilibili-favorites/resource-revisions";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { BilibiliAuthExpiredError } from "../features/bilibili-session/auth-expiration";
import { bilibiliSession } from "../features/bilibili-session/session";
import { useBilibiliSessionState } from "../features/bilibili-session/useBilibiliSession";
import fetcher from "./fetcher";
import {
  createBilibiliFavoriteFolder,
  deleteBilibiliFavoriteFolder,
  FavoriteFolderResultUnknownError,
  fetchBilibiliFavoriteFolders,
  fetchBilibiliFavoriteResources,
  FAVORITE_PAGE_SIZE,
  getFavoriteFoldersKey,
  getFavoriteListItems,
  getFavoriteResourcesKey,
} from "./favorites";
import type {
  FavoriteAccount,
  FavoriteResourcePage,
  FavoriteResources,
  FavoriteResourcesKeyLoader,
} from "./favorites.types";
import { getBilibiliLoginCookie } from "./get-cookie";

const favoriteOptions = {
  keepPreviousData: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: (error: Error) =>
    !(
      error instanceof BilibiliAuthExpiredError ||
      error instanceof BilibiliSessionChangedError ||
      error instanceof FavoriteResourcesChangedError
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
  const { cache, mutate: mutateCache } = useSWRConfig();
  const pending = useRef(false);
  const response = useSWRInfinite<FavoriteResourcePage, Error, FavoriteResourcesKeyLoader>(
    (index, previous: FavoriteResources | null) =>
      getFavoriteResourcesKey(account, folderId, index, previous),
    async ([, mid, generation, mediaId, logicalPage]) => {
      const current = { mid, generation };
      const state = getFavoriteResourceState(mutateCache, current, mediaId);
      const { revision, removalCount } = state;
      const seen = new Set<string>();
      let previous: FavoriteResourcePage | undefined;
      for (let index = 0; index < logicalPage - 1; index += 1) {
        const key = getFavoriteResourcesKey(current, mediaId, index, null);
        previous = cache.get(unstable_serialize(key))?.data;
        for (const media of previous?.medias ?? []) {
          seen.add(`${media.type}:${media.id}`);
        }
      }
      if (logicalPage > 1 && !previous) {
        throw new FavoriteResourcesChangedError();
      }
      // 热更新前的内存缓存可能还没有分页元数据。
      const previousPagination = previous?.pagination;
      // 缓存页序号保持稳定，只回退实际请求页码，补齐删除后前移的分页边界。
      let serverPage = previous
        ? Math.max(
            1,
            (previousPagination?.serverPage ?? logicalPage - 1) +
              1 -
              Math.ceil(
                (removalCount - (previousPagination?.removalCount ?? 0)) / FAVORITE_PAGE_SIZE,
              ),
          )
        : 1;
      while (true) {
        const data = await fetchBilibiliFavoriteResources(mediaId, serverPage, fetcher, () =>
          bilibiliSession.isCurrentAccount(current),
        );
        // SWR Infinite 的单页写入不受聚合 key 的竞态保护。
        if (getFavoriteResourceRevision(mutateCache, current, mediaId) !== revision) {
          throw new FavoriteResourcesChangedError();
        }
        const medias = data.medias.filter((media) => {
          const key = `${media.type}:${media.id}`;
          if (seen.has(key) || (media.type === 2 && state.excludedVideoIds.has(String(media.id)))) {
            return false;
          }
          seen.add(key);
          return true;
        });
        if (medias.length || !data.has_more || !data.medias.length) {
          return { ...data, medias, pagination: { serverPage, removalCount } };
        }
        serverPage += 1;
      }
    },
    { ...favoriteOptions, revalidateFirstPage: false, persistSize: false },
  );
  const { data, size, setSize, mutate, isLoading, isValidating, error } = response;

  // SWR 会缓存每个收藏夹的 size；切换时保留页数据，但从第一页重新展示。
  useEffect(() => {
    void setSize(1).catch(() => {});
  }, [account?.mid, account?.generation, folderId, setSize]);

  const pages = account && folderId ? (data?.slice(0, size) ?? []) : [];
  const hasMore = pages.at(-1)?.has_more ?? false;
  const isLoadingMore = isLoading || (isValidating && !error && size > pages.length && hasMore);

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
      await setSize((value) => Math.min(value, pages.length) + 1);
    } finally {
      pending.current = false;
    }
  }

  async function refresh() {
    if (!account || !folderId || !bilibiliSession.isCurrentAccount(account)) {
      return;
    }
    invalidateFavoriteResourceRequests(mutateCache, account, [folderId]);
    getFavoriteResourceState(mutateCache, account, folderId).excludedVideoIds.clear();
    await setSize(1);
    await clearFavoriteResourcePages(account, new Set([folderId]), mutateCache);
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
