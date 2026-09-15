import { beforeEach, describe, expect, test, vi } from "vitest";

import { getProgressRatio } from "../utils/watch-progress";
import type { HistoryRecord } from "./history.types";
import type { WatchProgressAccount, WatchProgressRequest } from "./watch-progress.types";

const mocks = vi.hoisted(() => ({
  account: { mid: "123", generation: 1 } as WatchProgressAccount,
  current: true,
  replaced: [] as Record<string, number>[],
  merged: [] as Record<string, number>[],
  request: vi.fn(),
}));

vi.mock("../features/bilibili-session/session", () => ({
  bilibiliSession: { isCurrentAccount: () => mocks.current },
}));
vi.mock("../store/watch-progress", () => ({
  replaceWatchProgress: (map: Record<string, number>) => {
    mocks.replaced.push(map);
  },
  mergeWatchProgress: (map: Record<string, number>) => {
    mocks.merged.push(map);
  },
}));
vi.mock("./fetcher", () => ({ default: mocks.request }));

import {
  collectWatchProgress,
  fetchRecentWatchProgressMap,
  fetchWatchProgressMap,
  refreshRecentWatchProgress,
  syncWatchProgress,
  WATCH_PROGRESS_RECORD_LIMIT,
} from "./watch-progress";

const account = { mid: "123", generation: 1 };

type RawRecord = {
  duration?: number;
  progress?: number;
  is_finish?: number;
  business?: string;
  bvid?: string;
};

function record(bvid: string, progress: number, duration: number, isFinish = 0) {
  return {
    title: bvid,
    duration,
    progress,
    is_finish: isFinish,
    view_at: 1788001866,
    history: { business: "archive", oid: 1, bvid, cid: 1, page: 1 },
  };
}

function parsed(raw: RawRecord, viewAt = 1788001866): HistoryRecord {
  return {
    title: raw.bvid,
    duration: raw.duration,
    progress: raw.progress,
    is_finish: raw.is_finish,
    view_at: viewAt,
    history: {
      business: raw.business ?? "archive",
      oid: 1,
      bvid: raw.bvid,
      cid: 1,
      page: 1,
    },
  };
}

/** 每次请求固定返回最多 `perPage` 条，模拟服务端对 ps 的截断 */
function pagingRequest(perPage: number) {
  return vi.fn<WatchProgressRequest>(async (url: string) => {
    const params = new URL(url, "https://api.bilibili.com").searchParams;
    const max = Number(params.get("max"));
    const size = Math.min(Number(params.get("ps")), perPage);
    const list = Array.from({ length: size }, (_, index) => record(`BV${max + index}`, 10, 100));
    return {
      cursor: { max: max + size, view_at: 1788001866 - max, business: "archive" },
      list,
    };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.current = true;
  mocks.replaced = [];
  mocks.merged = [];
});

describe("watch progress ratio", () => {
  test("computes the progress ratio boundaries", () => {
    expect(getProgressRatio(15, 734, false)).toBeCloseTo(15 / 734);
    expect(getProgressRatio(734, 734, false)).toBe(1);
    expect(getProgressRatio(900, 734, false)).toBe(1);
    expect(getProgressRatio(0, 734, false)).toBe(0);
    expect(getProgressRatio(0, 0, false)).toBe(0);
    expect(getProgressRatio(0, 0, true)).toBe(1);
    expect(getProgressRatio(10, 100, true)).toBe(1);
    // 接口用 -1 表示已看完，此时即使时长缺失也要显示满格
    expect(getProgressRatio(-1, 100, false)).toBe(1);
    expect(getProgressRatio(-1, 0, false)).toBe(1);
    expect(getProgressRatio(Number.NaN, 100, false)).toBe(0);
  });
});

describe("collecting watch progress by bvid", () => {
  test("keeps the most recent record per bvid and ignores unusable records", () => {
    const map = collectWatchProgress([
      parsed({ bvid: "BV1", progress: 50, duration: 100 }),
      parsed({ bvid: "BV1", progress: 10, duration: 100 }),
      parsed({ bvid: "BV2", progress: 5, duration: 100, is_finish: 1 }),
      parsed({ bvid: "", progress: 50, duration: 100 }),
      parsed({ bvid: "BV3", progress: 50, duration: 100, business: "live" }),
      parsed({ bvid: "BV4", progress: 50 }),
    ]);
    expect(map).toEqual({
      BV1: { ratio: 0.5, updatedAt: 1788001866000 },
      BV2: { ratio: 1, updatedAt: 1788001866000 },
      BV4: { ratio: 0, updatedAt: 1788001866000 },
    });
  });
});

describe("fetching the watch progress map", () => {
  test("pages through the newest history until the 100-record limit", async () => {
    const request = pagingRequest(20);
    const map = await fetchWatchProgressMap(request, () => true);
    expect(
      new URL(request.mock.calls[0][0], "https://api.bilibili.com").searchParams.get("ps"),
    ).toBe("20");
    expect(request).toHaveBeenCalledTimes(WATCH_PROGRESS_RECORD_LIMIT / 20);
    expect(Object.keys(map)).toHaveLength(WATCH_PROGRESS_RECORD_LIMIT);
  });

  test("stops as soon as the server reports the end", async () => {
    const request = vi.fn<WatchProgressRequest>().mockResolvedValue({
      cursor: { max: 0, view_at: 0, business: "" },
      list: [record("BV1", 30, 100)],
    });
    const map = await fetchWatchProgressMap(request, () => true);
    expect(request).toHaveBeenCalledOnce();
    expect(map).toEqual({ BV1: { ratio: 0.3, updatedAt: 1788001866000 } });
  });

  test("gives up on an endless cursor after a bounded number of pages", async () => {
    const request = pagingRequest(5);
    const map = await fetchWatchProgressMap(request, () => true);
    expect(request).toHaveBeenCalledTimes(10);
    expect(Object.keys(map)).toHaveLength(50);
  });

  test("keeps the pages already fetched when a later page fails", async () => {
    const pages = pagingRequest(20);
    let calls = 0;
    const request = vi.fn<WatchProgressRequest>(async (url: string) => {
      calls += 1;
      if (calls === 2) {
        throw new Error("offline");
      }
      return pages(url);
    });
    const map = await fetchWatchProgressMap(request, () => true);
    expect(request).toHaveBeenCalledTimes(2);
    expect(Object.keys(map)).toHaveLength(20);
  });

  test("rejects when the first page fails and when the session expired", async () => {
    const request = vi.fn<WatchProgressRequest>().mockRejectedValue(new Error("offline"));
    await expect(fetchWatchProgressMap(request, () => true)).rejects.toThrow("offline");
    const stale = pagingRequest(20);
    await expect(fetchWatchProgressMap(stale, () => false)).rejects.toBeDefined();
    expect(stale).not.toHaveBeenCalled();
  });

  test("only asks for the newest few records when refreshing incrementally", async () => {
    const request = pagingRequest(20);
    const map = await fetchRecentWatchProgressMap(request, () => true);
    expect(request).toHaveBeenCalledOnce();
    expect(
      new URL(request.mock.calls[0][0], "https://api.bilibili.com").searchParams.get("ps"),
    ).toBe("5");
    expect(Object.keys(map)).toHaveLength(5);
  });
});

describe("syncing the watch progress map into the store", () => {
  beforeEach(() => {
    mocks.request.mockImplementation(pagingRequest(20));
  });

  test("replaces the store after a full sync and merges after a recent refresh", async () => {
    await syncWatchProgress(account);
    expect(mocks.replaced).toHaveLength(1);
    expect(mocks.merged).toHaveLength(0);
    await refreshRecentWatchProgress(account);
    expect(mocks.merged).toHaveLength(1);
    expect(mocks.replaced).toHaveLength(1);
  });

  test("skips the request and the store write for expired sessions", async () => {
    mocks.current = false;
    await syncWatchProgress(account);
    await refreshRecentWatchProgress(account);
    expect(mocks.request).not.toHaveBeenCalled();
    expect(mocks.replaced).toEqual([]);
    expect(mocks.merged).toEqual([]);
  });

  test("swallows request failures", async () => {
    mocks.request.mockRejectedValue(new Error("offline"));
    await expect(syncWatchProgress(account)).resolves.toBeUndefined();
    expect(mocks.replaced).toEqual([]);
  });
});
