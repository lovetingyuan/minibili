import type { ScopedMutator } from "swr";
import { unstable_serialize } from "swr/infinite";

import { getFavoriteFoldersKey, getFavoriteResourcesKey } from "../../api/favorites";
import type { FavoriteAccount, FavoriteResources } from "../../api/favorites.types";
import { getFavoriteChanges, getVideoRelationKey } from "../../api/video-favorites";
import type { VideoFavoriteChange } from "../../api/video-favorites.types";
import { clearFavoriteResourcePages } from "./mutations";
import {
  getFavoriteResourceRevision,
  invalidateFavoriteResourceRequests,
} from "./resource-revisions";

export async function syncFavoriteCaches(
  account: FavoriteAccount,
  change: VideoFavoriteChange,
  mutate: ScopedMutator,
  isCurrent: () => boolean,
) {
  const { add, remove } = getFavoriteChanges(change.initialIds, change.selectedIds);
  const removed = new Set(remove);
  const pending = new Map(
    [...new Set([...add, ...remove])].map((id) => [
      id,
      getFavoriteResourceRevision(mutate, account, id),
    ]),
  );

  // 写接口成功后，列表接口可能仍返回旧快照。仅重试 GET，绝不重发收藏 POST。
  for (const delay of [1000, 1500, 2500]) {
    if (!pending.size) {
      return;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
    if (!isCurrent()) {
      return;
    }
    for (const [id, revision] of pending) {
      // 新的收藏操作拥有后续刷新，旧定时任务不能覆盖用户的新选择。
      if (getFavoriteResourceRevision(mutate, account, id) !== revision) {
        pending.delete(id);
      }
    }
    if (!pending.size) {
      return;
    }

    const ids = new Set(pending.keys());
    invalidateFavoriteResourceRequests(mutate, account, ids);
    for (const id of ids) {
      pending.set(id, getFavoriteResourceRevision(mutate, account, id));
    }
    // 每次都清掉单页缓存，再以单参数 mutate(key) 等待真正的分页 GET 完成。
    // 只刷新聚合 key 会复用 useSWRInfinite 的单页缓存。
    await clearFavoriteResourcePages(account, ids, mutate);
    if (!isCurrent()) {
      return;
    }
    await Promise.allSettled([
      mutate(getFavoriteFoldersKey(account)),
      mutate(getVideoRelationKey(account, change.video)),
      mutate(`/x/web-interface/view?bvid=${change.video.bvid}`),
      ...[...ids].map(async (id) => {
        const revision = pending.get(id);
        if (getFavoriteResourceRevision(mutate, account, id) !== revision) {
          return;
        }
        const key = unstable_serialize(() => getFavoriteResourcesKey(account, id, 0, null));
        const pages = await mutate<FavoriteResources[]>(key);
        if (!isCurrent() || getFavoriteResourceRevision(mutate, account, id) !== revision) {
          return;
        }
        const stale =
          removed.has(id) &&
          pages?.some((page) =>
            page.medias.some((media) => media.type === 2 && String(media.id) === change.video.aid),
          );
        if (!stale) {
          pending.delete(id);
          return;
        }
        // 服务端尚未同步时继续保留已确认的删除结果，再稍后重新请求。
        await mutate<FavoriteResources[]>(
          key,
          (current) =>
            current?.map((page) => ({
              ...page,
              info: { ...page.info, media_count: Math.max(0, page.info.media_count - 1) },
              medias: page.medias.filter(
                (media) => media.type !== 2 || String(media.id) !== change.video.aid,
              ),
            })),
          { revalidate: false },
        );
      }),
    ]);
  }
}
