import { useSyncExternalStore } from "react";
import useSWR, { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";

import {
  favoriteMutationKey,
  refreshFavoriteCaches,
} from "../features/bilibili-favorites/mutations";
import { syncFavoriteCaches } from "../features/bilibili-favorites/sync";
import { videoRelationMutations as mutations } from "../features/bilibili-favorites/video-relation-mutations";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { BilibiliAuthExpiredError } from "../features/bilibili-session/auth-expiration";
import { bilibiliSession } from "../features/bilibili-session/session";
import type { FavoriteAccount } from "./favorites.types";
import fetcher from "./fetcher";
import { getBilibiliLoginCookie } from "./get-cookie";
import {
  FavoriteLoginRequiredError,
  fetchVideoFavoriteFolders,
  fetchVideoRelation,
  getVideoFavoriteFoldersKey,
  getVideoRelationKey,
  modifyVideoFavorites,
} from "./video-favorites";
import type {
  FavoriteVideo,
  VideoFavoriteChange,
  VideoRelation,
  VideoRelationKey,
} from "./video-favorites.types";

const options = {
  keepPreviousData: false,
  revalidateOnFocus: false,
  shouldRetryOnError: (error: Error) =>
    !(
      error instanceof BilibiliAuthExpiredError ||
      error instanceof BilibiliSessionChangedError ||
      error instanceof FavoriteLoginRequiredError
    ),
  errorRetryCount: 2,
};

export function useVideoRelation(account: FavoriteAccount | null, video: FavoriteVideo | null) {
  const current = account && bilibiliSession.isCurrentAccount(account) ? account : null;
  const response = useSWR(
    current && video ? getVideoRelationKey(current, video) : null,
    ([, mid, generation, aid, bvid]) =>
      fetchVideoRelation({ aid, bvid }, fetcher, () =>
        bilibiliSession.isCurrentAccount({ mid, generation }),
      ),
    options,
  );
  return { ...response, data: current && video ? response.data : undefined };
}

export function useVideoFavoriteFolders(account: FavoriteAccount, video: FavoriteVideo) {
  return useSWRMutation(
    bilibiliSession.isCurrentAccount(account) ? getVideoFavoriteFoldersKey(account, video) : null,
    ([, mid, generation, aid, bvid]) =>
      fetchVideoFavoriteFolders({ mid, generation }, { aid, bvid }, fetcher, () =>
        bilibiliSession.isCurrentAccount({ mid, generation }),
      ),
    // 手动触发 GET：普通 mutate() 在刷新失败时可能返回旧缓存。
    // trigger 会传播请求错误，确保打开弹窗和不确定结果的恢复都取得新快照。
    {
      populateCache: true,
      revalidate: false,
      throwOnError: true,
    },
  );
}

export function useModifyVideoFavorites(account: FavoriteAccount, video: FavoriteVideo) {
  const { mutate } = useSWRConfig();
  const pending = useSyncExternalStore(mutations.subscribe, mutations.getSnapshot);
  const { trigger } = useSWRMutation<
    VideoFavoriteChange,
    Error,
    VideoRelationKey,
    VideoFavoriteChange,
    VideoRelation
  >(
    getVideoRelationKey(account, video),
    (_key, { arg }) =>
      modifyVideoFavorites(account, arg, {
        readCookie: getBilibiliLoginCookie,
        isCurrentAccount: bilibiliSession.isCurrentAccount,
      }),
    {
      revalidate: false,
      populateCache: (change, current) => ({ ...current, favorite: change.selectedIds.length > 0 }),
    },
  );
  async function save(initialIds: number[], selectedIds: number[]) {
    const change = { video, initialIds, selectedIds };
    await mutations.run(account, video.aid, () => trigger(change));
    // 刷新错误与已经成功的写操作分离，不延迟弹窗关闭。
    void Promise.resolve()
      .then(async () => {
        if (!bilibiliSession.isCurrentAccount(account)) {
          return;
        }
        await refreshFavoriteCaches(account, change, mutate);
        await syncFavoriteCaches(account, change, mutate, () =>
          bilibiliSession.isCurrentAccount(account),
        );
      })
      .catch(() => {});
  }
  return { save, isMutating: pending.has(favoriteMutationKey(account, video.aid)) };
}
