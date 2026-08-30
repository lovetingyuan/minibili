import { describe, expect, test, vi } from "vitest";

import type { UpInfo } from "@/types";

import {
  fetchBilibiliFollowings,
  FollowingsCancelledError,
  getFollowingsKey,
  mergeFollowedUps,
} from "./followings";

function createFollowing(mid: number) {
  return {
    mid,
    uname: `up-${mid}`,
    face: `face-${mid}`,
    sign: `sign-${mid}`,
  };
}

describe("Bilibili followings", () => {
  test("isolates list caches by account and session generation", () => {
    expect(getFollowingsKey("123", 1)).not.toEqual(getFollowingsKey("456", 1));
    expect(getFollowingsKey("123", 1)).not.toEqual(getFollowingsKey("123", 2));
    expect(getFollowingsKey("123", 1)).toEqual(["bilibili-followings", "123", 1]);
  });

  test("stops pagination without importing partial data when the session ends", async () => {
    let active = true;
    const request = vi.fn(async () => {
      active = false;
      return {
        list: Array.from({ length: 24 }, (_, index) => createFollowing(index + 1)),
        total: 100,
      };
    });
    await expect(fetchBilibiliFollowings("1", request, () => active)).rejects.toBeInstanceOf(
      FollowingsCancelledError,
    );
    expect(request).toHaveBeenCalledOnce();
  });

  test("fetches every page and removes duplicated mids", async () => {
    const firstPage = Array.from({ length: 24 }, (_, index) => createFollowing(index + 1));
    const request = vi.fn(async (url: string) => {
      if (url.includes("pn=1")) {
        return { list: firstPage, total: 26 };
      }
      return { list: [createFollowing(24), createFollowing(25), createFollowing(26)], total: 26 };
    });

    const result = await fetchBilibiliFollowings("393120021", request);

    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[0][0]).toContain("vmid=393120021");
    expect(request.mock.calls[0][0]).toContain("pn=1&ps=24");
    expect(request.mock.calls[1][0]).toContain("pn=2&ps=24");
    expect(result).toHaveLength(26);
    expect(result[24]).toEqual({
      mid: 25,
      name: "up-25",
      face: "face-25",
      sign: "sign-25",
    });
  });

  test("rejects an early empty page without importing a partial list", async () => {
    const request = vi
      .fn<(url: string) => Promise<unknown>>()
      .mockResolvedValueOnce({ list: [createFollowing(1)], total: 30 })
      .mockResolvedValueOnce({ list: [], total: 30 });

    await expect(fetchBilibiliFollowings("1", request)).rejects.toThrow("不完整");
  });

  test("accepts an actually empty remote list", async () => {
    await expect(
      fetchBilibiliFollowings("1", async () => ({ list: [], total: 0 })),
    ).resolves.toEqual([]);
  });

  test("rejects a truncated final page or a changing total", async () => {
    await expect(
      fetchBilibiliFollowings("1", async () => ({
        list: [createFollowing(1)],
        total: 2,
      })),
    ).rejects.toThrow("不完整");
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        list: Array.from({ length: 24 }, (_, index) => createFollowing(index + 1)),
        total: 25,
      })
      .mockResolvedValueOnce({ list: [createFollowing(25)], total: 26 });
    await expect(fetchBilibiliFollowings("1", request)).rejects.toThrow("数量发生变化");
    expect(request).toHaveBeenCalledTimes(2);
  });

  test("rejects the whole import when a later page fails", async () => {
    const request = vi
      .fn<(url: string) => Promise<unknown>>()
      .mockResolvedValueOnce({
        list: Array.from({ length: 24 }, (_, index) => createFollowing(index + 1)),
        total: 25,
      })
      .mockRejectedValueOnce(new Error("network error"));

    await expect(fetchBilibiliFollowings("1", request)).rejects.toThrow("network error");
  });

  test("removes local-only entries while updating profiles and preserving pin", () => {
    const local: UpInfo[] = [
      { mid: "1", name: "old", face: "old-face", sign: "old-sign", pin: 10 },
      { mid: 2, name: "manual", face: "manual-face", sign: "manual-sign" },
      { mid: 2, name: "duplicate", face: "duplicate-face", sign: "duplicate-sign" },
    ];
    const imported: UpInfo[] = [
      { mid: 1, name: "new", face: "new-face", sign: "new-sign" },
      { mid: 3, name: "remote", face: "remote-face", sign: "remote-sign" },
      { mid: 3, name: "remote", face: "remote-face", sign: "remote-sign" },
    ];

    expect(mergeFollowedUps(local, imported)).toEqual([
      { mid: 1, name: "new", face: "new-face", sign: "new-sign", pin: 10 },
      { mid: 3, name: "remote", face: "remote-face", sign: "remote-sign" },
    ]);
  });

  test("follows remote order and clears local records on an empty remote list", () => {
    const local: UpInfo[] = [
      { mid: 1, name: "one", face: "", sign: "", pin: 7 },
      { mid: 2, name: "two", face: "", sign: "" },
    ];
    expect(
      mergeFollowedUps(local, [local[1], { mid: "1", name: "new", face: "", sign: "" }]),
    ).toEqual([local[1], { mid: "1", name: "new", face: "", sign: "", pin: 7 }]);
    expect(mergeFollowedUps(local, [])).toEqual([]);
  });

  test("preserves the local array reference when nothing changes", () => {
    const local: UpInfo[] = [{ mid: "1", name: "up", face: "face", sign: "sign" }];
    const imported: UpInfo[] = [{ mid: 1, name: "up", face: "face", sign: "sign" }];

    expect(mergeFollowedUps(local, imported)).toBe(local);
  });
});
