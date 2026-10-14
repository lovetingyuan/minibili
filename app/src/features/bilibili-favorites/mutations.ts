import type { ScopedMutator } from "swr";
import { unstable_serialize } from "swr/infinite";

import { getFavoriteFoldersKey, getFavoriteResourcesKey } from "../../api/favorites";
import type {
  FavoriteAccount,
  FavoriteFolders,
  FavoriteResourcePage,
} from "../../api/favorites.types";
import { getFavoriteChanges, getVideoFavoriteFoldersKey } from "../../api/video-favorites";
import type { VideoFavoriteChange, VideoFavoriteFolders } from "../../api/video-favorites.types";
import { BilibiliSessionChangedError } from "../bilibili-session/controller";
import { getFavoriteResourceState, invalidateFavoriteResourceRequests } from "./resource-revisions";

export function favoriteMutationKey(account: FavoriteAccount, aid: string) {
  return `${account.mid}:${account.generation}:${aid}`;
}

export function createFavoriteMutations(
  isCurrent: (account: FavoriteAccount) => boolean,
  pendingMessage = "收藏操作正在进行，请稍候",
) {
  let pending: ReadonlySet<string> = new Set();
  const listeners = new Set<() => void>();
  function publish(next: ReadonlySet<string>) {
    pending = next;
    listeners.forEach((listener) => listener());
  }
  return {
    getSnapshot: () => pending,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async run<T>(account: FavoriteAccount, aid: string, work: () => Promise<T>) {
      if (!isCurrent(account)) {
        throw new BilibiliSessionChangedError();
      }
      const key = favoriteMutationKey(account, aid);
      if (pending.has(key)) {
        throw new Error(pendingMessage);
      }
      publish(new Set(pending).add(key));
      try {
        const result = await work();
        if (!isCurrent(account)) {
          throw new BilibiliSessionChangedError();
        }
        return result;
      } finally {
        const next = new Set(pending);
        next.delete(key);
        publish(next);
      }
    },
  };
}

export async function updateFavoriteCaches(
  account: FavoriteAccount,
  change: VideoFavoriteChange,
  mutate: ScopedMutator,
) {
  const { add, remove } = getFavoriteChanges(change.initialIds, change.selectedIds);
  const folderIds = new Set([...add, ...remove]);
  const removedIds = new Set(remove);
  const addedIds = new Set(add);
  invalidateFavoriteResourceRequests(mutate, account, folderIds);
  for (const folderId of folderIds) {
    const state = getFavoriteResourceState(mutate, account, folderId);
    state.removalCount += Number(removedIds.has(folderId));
    // 续页可能仍返回旧快照；新添加的视频也留待手动刷新后展示。
    state.excludedVideoIds.add(change.video.aid);
  }

  function updateCount(folderId: number, count: number) {
    return Math.max(0, count + Number(addedIds.has(folderId)) - Number(removedIds.has(folderId)));
  }
  function updatePage(page: FavoriteResourcePage) {
    const folderId = page.info.id;
    return {
      ...page,
      info: { ...page.info, media_count: updateCount(folderId, page.info.media_count) },
      medias: removedIds.has(folderId)
        ? page.medias.filter((media) => media.type !== 2 || String(media.id) !== change.video.aid)
        : page.medias,
    };
  }

  return Promise.allSettled([
    // 保留收藏夹，避免 selectedId 和分页 key 暂时变成 undefined，触发列表重建。
    mutate<FavoriteFolders>(
      getFavoriteFoldersKey(account),
      (current) =>
        current && {
          ...current,
          list: current.list.map((folder) => ({
            ...folder,
            media_count: updateCount(folder.id, folder.media_count),
          })),
        },
      { revalidate: false },
    ),
    mutate<VideoFavoriteFolders>(
      getVideoFavoriteFoldersKey(account, change.video),
      (current) =>
        current && {
          ...current,
          list: current.list.map((folder) => ({
            ...folder,
            fav_state: change.selectedIds.includes(folder.id) ? 1 : 0,
            media_count: updateCount(folder.id, folder.media_count),
          })),
        },
      { revalidate: false },
    ),
    mutate<FavoriteResourcePage>(
      (key) =>
        Array.isArray(key) &&
        key[0] === "bilibili-favorite-resources" &&
        key[1] === account.mid &&
        key[2] === account.generation &&
        folderIds.has(key[3]),
      (current) => current && updatePage(current),
      { revalidate: false },
    ),
    ...[...folderIds].map((folderId) =>
      mutate<FavoriteResourcePage[]>(
        unstable_serialize(() => getFavoriteResourcesKey(account, folderId, 0, null)),
        (pages) => pages?.map(updatePage),
        { revalidate: false },
      ),
    ),
  ]);
}

export function clearFavoriteResourcePages(
  account: FavoriteAccount,
  folderIds: ReadonlySet<number>,
  mutate: ScopedMutator,
) {
  return mutate(
    (key) =>
      Array.isArray(key) &&
      key[0] === "bilibili-favorite-resources" &&
      key[1] === account.mid &&
      key[2] === account.generation &&
      folderIds.has(key[3]),
    undefined,
    { revalidate: false },
  );
}
