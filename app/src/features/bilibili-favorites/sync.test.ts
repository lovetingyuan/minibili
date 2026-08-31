import { afterEach, describe, expect, test, vi } from "vitest";
import { unstable_serialize } from "swr/infinite";

import { getFavoriteResourcesKey } from "../../api/favorites";
import type { FavoriteResources } from "../../api/favorites.types";
import { invalidateFavoriteResourceRequests } from "./resource-revisions";
import { syncFavoriteCaches } from "./sync";

const account = { mid: "123", generation: 1 };
const change = { video: { aid: "123", bvid: "BV1" }, initialIds: [11], selectedIds: [] };
const key = unstable_serialize(() => getFavoriteResourcesKey(account, 11, 0, null));
const stalePage: FavoriteResources = {
  info: { id: 11, fid: 1, mid: 123, title: "收藏夹", media_count: 2 },
  medias: [
    { id: 123, type: 2, title: "removed" },
    { id: 456, type: 2, title: "kept" },
  ],
  has_more: false,
};
const freshPage = {
  ...stalePage,
  medias: [stalePage.medias[1]],
  info: { ...stalePage.info, media_count: 1 },
};

function setup(staleResponses = 0) {
  vi.useFakeTimers();
  let requests = 0;
  let pages = [freshPage];
  const mutate = vi.fn();
  mutate.mockImplementation(async (...args: unknown[]) => {
    if (args[0] === key && args.length === 1) {
      pages = [requests++ < staleResponses ? stalePage : freshPage];
      return pages;
    }
    if (args[0] === key && typeof args[1] === "function") {
      pages = args[1](pages);
      return pages;
    }
    return undefined;
  });
  return { mutate, requests: () => requests, pages: () => pages };
}

afterEach(() => vi.useRealTimers());

describe("delayed favorite cache synchronization", () => {
  test("waits one second, clears page caches, then explicitly revalidates and awaits the aggregate", async () => {
    const { mutate, requests } = setup();
    const result = syncFavoriteCaches(account, change, mutate, () => true);
    await vi.advanceTimersByTimeAsync(999);
    expect(mutate).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await result;
    expect(requests()).toBe(1);
    const [filter, data, options] = mutate.mock.calls[0];
    if (typeof filter !== "function") throw new Error("Expected page cache invalidation");
    expect(filter(["bilibili-favorite-resources", "123", 1, 11, 2])).toBe(true);
    expect(filter(["bilibili-favorite-resources", "123", 1, 22, 1])).toBe(false);
    expect(data).toBeUndefined();
    expect(options).toEqual({ revalidate: false });
    expect(mutate.mock.calls.find((args) => args[0] === key)).toEqual([key]);
    expect(vi.getTimerCount()).toBe(0);
  });

  test("retries stale server snapshots and keeps the confirmed removal visible until the GET catches up", async () => {
    const { mutate, requests, pages } = setup(2);
    const result = syncFavoriteCaches(account, change, mutate, () => true);
    await vi.advanceTimersByTimeAsync(1000);
    expect(requests()).toBe(1);
    expect(pages()[0].medias.map((media) => media.id)).toEqual([456]);
    await vi.advanceTimersByTimeAsync(1499);
    expect(requests()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(requests()).toBe(2);
    expect(pages()[0].medias.map((media) => media.id)).toEqual([456]);
    await vi.advanceTimersByTimeAsync(2500);
    await result;
    expect(requests()).toBe(3);
    expect(pages()).toEqual([freshPage]);
    expect(vi.getTimerCount()).toBe(0);
  });

  test("bounds repeated stale responses to three GET attempts", async () => {
    const { mutate, requests, pages } = setup(Infinity);
    const result = syncFavoriteCaches(account, change, mutate, () => true);
    await vi.runAllTimersAsync();
    await result;
    expect(requests()).toBe(3);
    expect(pages()[0].medias.map((media) => media.id)).toEqual([456]);
  });

  test.each(["account", "new selection"])(
    "stops delayed work after a %s change",
    async (reason) => {
      const { mutate } = setup();
      let current = true;
      const result = syncFavoriteCaches(account, change, mutate, () => current);
      if (reason === "account") current = false;
      else invalidateFavoriteResourceRequests(mutate, account, [11]);
      await vi.runAllTimersAsync();
      await result;
      expect(mutate).not.toHaveBeenCalled();
    },
  );

  test("does not schedule work for unchanged selections", async () => {
    const { mutate } = setup();
    await syncFavoriteCaches(account, { ...change, selectedIds: [11] }, mutate, () => true);
    expect(mutate).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
