import { mutate, SWRConfig, unstable_serialize as serializeKey } from "swr";
import { unstable_serialize } from "swr/infinite";
import { describe, expect, test, vi } from "vitest";

import { getFavoriteFoldersKey, getFavoriteResourcesKey } from "../../api/favorites";
import { getVideoRelationKey } from "../../api/video-favorites";
import { BilibiliSessionChangedError } from "../bilibili-session/controller";
import { createFavoriteMutations, favoriteMutationKey, refreshFavoriteCaches } from "./mutations";

const account = { mid: "favorite-test", generation: 1 };
const video = { aid: "123", bvid: "BV1" };

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

  test("invalidates affected inactive pages and infinite aggregates without touching other accounts/folders", async () => {
    const changedPage = getFavoriteResourcesKey(account, 11, 0, null);
    const otherPage = getFavoriteResourcesKey(account, 22, 0, null);
    const otherAccountPage = getFavoriteResourcesKey({ ...account, mid: "another" }, 11, 0, null);
    const infiniteKey = unstable_serialize(() => changedPage);
    const foldersKey = getFavoriteFoldersKey(account);
    const relationKey = getVideoRelationKey(account, video);
    for (const key of [changedPage, otherPage, otherAccountPage, infiniteKey, foldersKey]) {
      await mutate(key, ["old data"], { revalidate: false });
      // useSWR/useSWRInfinite 保存原始 key，供全局 mutate 的过滤器识别。
      const serialized = serializeKey(key);
      const cache = SWRConfig.defaultValue.cache;
      const entry = { ...cache.get(serialized), _k: key };
      cache.set(serialized, entry);
    }
    await mutate(relationKey, { favorite: true }, { revalidate: false });
    await refreshFavoriteCaches(account, { video, initialIds: [], selectedIds: [11] }, mutate);
    expect(await mutate(changedPage)).toBeUndefined();
    expect(await mutate(infiniteKey)).toBeUndefined();
    expect(await mutate(foldersKey)).toBeUndefined();
    expect(await mutate(otherPage)).toEqual(["old data"]);
    expect(await mutate(otherAccountPage)).toEqual(["old data"]);
    expect(await mutate(relationKey)).toEqual({ favorite: true });
  });
});
