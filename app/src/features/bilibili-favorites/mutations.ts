import type { ScopedMutator } from "swr";
import { unstable_serialize } from "swr/infinite";

import { getFavoriteFoldersKey, getFavoriteResourcesKey } from "../../api/favorites";
import type {
  FavoriteAccount,
  FavoriteFolders,
  FavoriteResources,
} from "../../api/favorites.types";
import { getFavoriteChanges, getVideoFavoriteFoldersKey } from "../../api/video-favorites";
import type { VideoFavoriteChange } from "../../api/video-favorites.types";
import { BilibiliSessionChangedError } from "../bilibili-session/controller";
import { invalidateFavoriteResourceRequests } from "./resource-revisions";

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

export async function refreshFavoriteCaches(
  account: FavoriteAccount,
  change: VideoFavoriteChange,
  mutate: ScopedMutator,
) {
  const { add, remove } = getFavoriteChanges(change.initialIds, change.selectedIds);
  const folderIds = new Set([...add, ...remove]);
  const removedIds = new Set(remove);
  const addedIds = new Set(add);
  invalidateFavoriteResourceRequests(mutate, account, folderIds);

  function updateCount(folderId: number, count: number) {
    return Math.max(0, count + Number(addedIds.has(folderId)) - Number(removedIds.has(folderId)));
  }
  // 清除未挂载列表的页缓存；只触发 mutate(key) 不会使这些旧数据失效。
  await clearFavoriteResourcePages(account, folderIds, mutate);
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
    mutate(getVideoFavoriteFoldersKey(account, change.video), undefined, { revalidate: false }),
    ...[...folderIds].map((folderId) =>
      mutate<FavoriteResources[]>(
        unstable_serialize(() => getFavoriteResourcesKey(account, folderId, 0, null)),
        // POST 已确认成功：立即移除对应视频；稍后独立发起 GET，给服务端同步时间。
        (pages) =>
          pages?.map((page) => ({
            ...page,
            info: { ...page.info, media_count: updateCount(folderId, page.info.media_count) },
            medias: removedIds.has(folderId)
              ? page.medias.filter(
                  (media) => media.type !== 2 || String(media.id) !== change.video.aid,
                )
              : page.medias,
          })),
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
