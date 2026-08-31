import { mutate, SWRConfig, unstable_serialize as serializeKey } from "swr";
import { unstable_serialize } from "swr/infinite";
import { describe, expect, test, vi } from "vitest";

import { getFavoriteFoldersKey, getFavoriteResourcesKey } from "../../api/favorites";
import type { FavoriteFolders, FavoriteResources } from "../../api/favorites.types";
import { getVideoRelationKey } from "../../api/video-favorites";
import { BilibiliSessionChangedError } from "../bilibili-session/controller";
import { createFavoriteMutations, favoriteMutationKey, refreshFavoriteCaches } from "./mutations";

const account = { mid: "favorite-test", generation: 1 };
const video = { aid: "123", bvid: "BV1" };

function createPage(folderId: number, ids = [123, 456]): FavoriteResources {
  return {
    info: { id: folderId, fid: 1, mid: 1, title: `收藏夹 ${folderId}`, media_count: ids.length },
    medias: ids.map((id) => ({ id, type: 2, title: String(id), bvid: `BV${id}` })),
    has_more: false,
  };
}

async function seed(key: Parameters<typeof serializeKey>[0], data: unknown) {
  await mutate(key, data, { revalidate: false });
  // useSWR/useSWRInfinite 保存原始 key，供全局 mutate 的过滤器识别。
  const serialized = serializeKey(key);
  const cache = SWRConfig.defaultValue.cache;
  const entry = { ...cache.get(serialized), _k: key };
  cache.set(serialized, entry);
}

describe("favorite mutation coordination", () => {
  test("locks the same account and video across components and releases after failure", async () => {
    const controller = createFavoriteMutations(() => true);
    const pending = Promise.withResolvers<void>();
    const work = vi.fn(() => pending.promise);
    const first = controller.run(account, video.aid, work);
    expect(controller.getSnapshot().has(favoriteMutationKey(account, video.aid))).toBe(true);
    await expect(controller.run(account, video.aid, work)).rejects.toThrow("正在进行");
    expect(work).toHaveBeenCalledOnce();
    const failure = expect(first).rejects.toThrow("offline");
    pending.reject(new Error("offline"));
    await failure;
    expect(controller.getSnapshot().size).toBe(0);
    await expect(controller.run(account, video.aid, async () => "ok")).resolves.toBe("ok");
  });

  test("rejects work and completions belonging to an obsolete session", async () => {
    let current = false;
    const controller = createFavoriteMutations(() => current);
    const work = vi.fn(async () => {
      current = false;
    });
    await expect(controller.run(account, video.aid, work)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    expect(work).not.toHaveBeenCalled();
    current = true;
    await expect(controller.run(account, video.aid, work)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    expect(controller.getSnapshot().size).toBe(0);
  });

  test("invalidates inactive page caches but retains folder and aggregate data during revalidation", async () => {
    const changedPage = getFavoriteResourcesKey(account, 11, 0, null);
    const otherPage = getFavoriteResourcesKey(account, 22, 0, null);
    const otherAccountPage = getFavoriteResourcesKey({ ...account, mid: "another" }, 11, 0, null);
    const infiniteKey = unstable_serialize(() => changedPage);
    const foldersKey = getFavoriteFoldersKey(account);
    const relationKey = getVideoRelationKey(account, video);
    const original = createPage(11, [456]);
    for (const key of [changedPage, otherPage, otherAccountPage]) {
      await seed(key, original);
    }
    await seed(infiniteKey, [original]);
    await seed(foldersKey, { list: [original.info], count: 1 });
    await mutate(relationKey, { favorite: true }, { revalidate: false });
    await refreshFavoriteCaches(account, { video, initialIds: [], selectedIds: [11] }, mutate);
    expect(await mutate(changedPage)).toBeUndefined();
    expect(await mutate(infiniteKey)).toEqual([
      { ...original, info: { ...original.info, media_count: 2 } },
    ]);
    expect(await mutate(foldersKey)).toEqual({
      list: [{ ...original.info, media_count: 2 }],
      count: 1,
    });
    expect(await mutate(otherPage)).toEqual(original);
    expect(await mutate(otherAccountPage)).toEqual(original);
    expect(await mutate(relationKey)).toEqual({ favorite: true });
  });

  test("removes only the confirmed video across cached pages and preserves the selected folder", async () => {
    const first = { ...createPage(31), has_more: true };
    const second = {
      ...createPage(31, [789, 123]),
      medias: [...createPage(31, [789, 123]).medias, { id: 123, type: 12, title: "同 ID 的音频" }],
    };
    const unaffected = createPage(32);
    const firstKey = getFavoriteResourcesKey(account, 31, 0, null);
    const secondKey = getFavoriteResourcesKey(account, 31, 1, first);
    const infiniteKey = unstable_serialize(() => firstKey);
    const otherInfiniteKey = unstable_serialize(() =>
      getFavoriteResourcesKey(account, 32, 0, null),
    );
    const folders: FavoriteFolders = { count: 2, list: [unaffected.info, first.info] };
    await seed(firstKey, first);
    await seed(secondKey, second);
    await seed(infiniteKey, [first, second]);
    await seed(otherInfiniteKey, [unaffected]);
    await seed(getFavoriteFoldersKey(account), folders);

    await refreshFavoriteCaches(
      account,
      { video, initialIds: [31, 32], selectedIds: [32] },
      mutate,
    );

    const pages = await mutate<FavoriteResources[]>(infiniteKey);
    expect(pages?.map((page) => page.medias.map(({ id, type }) => `${id}:${type}`))).toEqual([
      ["456:2"],
      ["789:2", "123:12"],
    ]);
    expect(pages?.map((page) => page.info.media_count)).toEqual([1, 1]);
    expect(await mutate<FavoriteFolders>(getFavoriteFoldersKey(account))).toEqual({
      ...folders,
      list: [unaffected.info, { ...first.info, media_count: 1 }],
    });
    expect(await mutate(otherInfiniteKey)).toEqual([unaffected]);
    expect(await mutate(firstKey)).toBeUndefined();
    expect(await mutate(secondKey)).toBeUndefined();
  });

  test("keeps an empty folder after removing its last video without inventing uncached pages", async () => {
    const page = createPage(41, [123]);
    const infiniteKey = unstable_serialize(() => getFavoriteResourcesKey(account, 41, 0, null));
    const uncachedKey = unstable_serialize(() => getFavoriteResourcesKey(account, 42, 0, null));
    await seed(infiniteKey, [page]);
    await seed(getFavoriteFoldersKey(account), { count: 1, list: [page.info] });
    await refreshFavoriteCaches(account, { video, initialIds: [41, 42], selectedIds: [] }, mutate);
    expect(await mutate(infiniteKey)).toEqual([
      { ...page, medias: [], info: { ...page.info, media_count: 0 } },
    ]);
    expect(await mutate(getFavoriteFoldersKey(account))).toEqual({
      count: 1,
      list: [{ ...page.info, media_count: 0 }],
    });
    expect(await mutate(uncachedKey)).toBeUndefined();
  });
});
