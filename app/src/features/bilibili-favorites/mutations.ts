import type { ScopedMutator } from "swr";
import { unstable_serialize } from "swr/infinite";

import { getFavoriteFoldersKey, getFavoriteResourcesKey } from "../../api/favorites";
import type { FavoriteAccount } from "../../api/favorites.types";
import {
  getFavoriteChanges,
  getVideoFavoriteFoldersKey,
  getVideoRelationKey,
} from "../../api/video-favorites";
import type { VideoFavoriteChange } from "../../api/video-favorites.types";
import { BilibiliSessionChangedError } from "../bilibili-session/controller";

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
      if (!isCurrent(account)) throw new BilibiliSessionChangedError();
      const key = favoriteMutationKey(account, aid);
      if (pending.has(key)) throw new Error(pendingMessage);
      publish(new Set(pending).add(key));
      try {
        const result = await work();
        if (!isCurrent(account)) throw new BilibiliSessionChangedError();
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
  // 清除未挂载列表的页缓存；只触发 mutate(key) 不会使这些旧数据失效。
  await mutate(
    (key) =>
      Array.isArray(key) &&
      key[0] === "bilibili-favorite-resources" &&
      key[1] === account.mid &&
      key[2] === account.generation &&
      folderIds.has(key[3]),
    undefined,
    { revalidate: false },
  );
  return Promise.allSettled([
    mutate(getVideoRelationKey(account, change.video)),
    mutate(`/x/web-interface/view?bvid=${change.video.bvid}`),
    mutate(getFavoriteFoldersKey(account), undefined, { revalidate: true }),
    mutate(getVideoFavoriteFoldersKey(account, change.video), undefined, { revalidate: false }),
    ...[...folderIds].map((folderId) =>
      mutate(
        unstable_serialize(() => getFavoriteResourcesKey(account, folderId, 0, null)),
        undefined,
        { revalidate: true },
      ),
    ),
  ]);
}
