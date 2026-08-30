import { describe, expect, test, vi } from "vitest";

import type { UpInfo } from "@/types";

import { fetchBilibiliFollowings, FollowingsCancelledError, mergeFollowedUps } from "./followings";

function createFollowing(mid: number) {
  return {
    mid,
    uname: `up-${mid}`,
    face: `face-${mid}`,
    sign: `sign-${mid}`,
  };
}

describe("Bilibili followings", () => {
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

  test("stops when an empty page is returned", async () => {
    const request = vi
      .fn<(url: string) => Promise<unknown>>()
      .mockResolvedValueOnce({ list: [createFollowing(1)], total: 30 })
      .mockResolvedValueOnce({ list: [], total: 30 });

    await expect(fetchBilibiliFollowings("1", request)).resolves.toHaveLength(1);
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

  test("keeps local entries and pin while updating and deduplicating profiles", () => {
    const local: UpInfo[] = [
      { mid: "1", name: "old", face: "old-face", sign: "old-sign", pin: 10 },
      { mid: 2, name: "manual", face: "manual-face", sign: "manual-sign" },
      { mid: 2, name: "duplicate", face: "duplicate-face", sign: "duplicate-sign" },
    ];
    const imported: UpInfo[] = [
      { mid: 1, name: "new", face: "new-face", sign: "new-sign" },
      { mid: 3, name: "remote", face: "remote-face", sign: "remote-sign" },
    ];

    expect(mergeFollowedUps(local, imported)).toEqual([
      { mid: "1", name: "new", face: "new-face", sign: "new-sign", pin: 10 },
      { mid: 2, name: "manual", face: "manual-face", sign: "manual-sign" },
      { mid: 3, name: "remote", face: "remote-face", sign: "remote-sign" },
    ]);
  });

  test("preserves the local array reference when nothing changes", () => {
    const local: UpInfo[] = [{ mid: "1", name: "up", face: "face", sign: "sign" }];
    const imported: UpInfo[] = [{ mid: 1, name: "up", face: "face", sign: "sign" }];

    expect(mergeFollowedUps(local, imported)).toBe(local);
  });
});
