import { describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { fetchBilibiliBlacklist, getBlacklistKey } from "./blacklist";
import type { BlacklistFetcher } from "./blacklist.types";

function blockedUp(mid: number) {
  return { mid, uname: `UP-${mid}`, face: `https://example.com/${mid}.jpg`, sign: `签名-${mid}` };
}

const firstPage = Array.from({ length: 20 }, (_, i) => blockedUp(i + 1));

describe("Bilibili blacklist", () => {
  test("loads beyond the first page, normalizes IDs and carries the relation version", async () => {
    const request = vi
      .fn<BlacklistFetcher>()
      .mockResolvedValueOnce({ list: firstPage, total: 21, re_version: 3 })
      .mockResolvedValueOnce({ list: [blockedUp(20), blockedUp(21)], total: 21, re_version: 3 });
    const blacklist = await fetchBilibiliBlacklist(request);
    expect(blacklist.size).toBe(21);
    expect(blacklist.get("21")).toEqual({
      mid: 21,
      name: "UP-21",
      face: "https://example.com/21.jpg",
      sign: "签名-21",
    });
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[0][0]).toContain("re_version=0&pn=1&ps=20");
    expect(request.mock.calls[1][0]).toContain("re_version=3&pn=2&ps=20");
  });

  test("accepts an empty blacklist", async () => {
    const request = vi
      .fn<BlacklistFetcher>()
      .mockResolvedValue({ list: [], total: 0, re_version: 0 });
    expect((await fetchBilibiliBlacklist(request)).size).toBe(0);
    expect(request).toHaveBeenCalledOnce();
  });

  test.each([
    { list: [], total: 21, re_version: 0 },
    { list: [blockedUp(1)], total: 21, re_version: 0 },
    { list: [blockedUp(21)], total: 22, re_version: 0 },
    { list: [blockedUp(21)], total: 21, re_version: 1 },
  ])("rejects incomplete or changing pagination: %j", async (secondPage) => {
    const request = vi
      .fn<BlacklistFetcher>()
      .mockResolvedValueOnce({ list: firstPage, total: 21, re_version: 0 })
      .mockResolvedValueOnce(secondPage);
    await expect(fetchBilibiliBlacklist(request)).rejects.toThrow(/不完整|发生变化/);
    expect(request).toHaveBeenCalledTimes(2);
  });

  test("rejects invalid payloads and preserves network errors", async () => {
    await expect(
      fetchBilibiliBlacklist(async () => ({ list: null, total: 1, re_version: 0 })),
    ).rejects.toThrow();
    const request = vi
      .fn<BlacklistFetcher>()
      .mockResolvedValueOnce({ list: firstPage, total: 21, re_version: 0 })
      .mockRejectedValueOnce(new Error("offline"));
    await expect(fetchBilibiliBlacklist(request)).rejects.toThrow("offline");
  });

  test("rejects stale sessions before requesting and after an in-flight page", async () => {
    const request = vi.fn<BlacklistFetcher>();
    await expect(fetchBilibiliBlacklist(request, () => false)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    expect(request).not.toHaveBeenCalled();
    let current = true;
    request.mockImplementation(async () => {
      current = false;
      return { list: firstPage, total: 21, re_version: 0 };
    });
    await expect(fetchBilibiliBlacklist(request, () => current)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    expect(request).toHaveBeenCalledOnce();
  });

  test("isolates cached lists by account and login generation", () => {
    expect(getBlacklistKey("1", 1)).not.toEqual(getBlacklistKey("2", 1));
    expect(getBlacklistKey("1", 1)).not.toEqual(getBlacklistKey("1", 2));
  });
});
