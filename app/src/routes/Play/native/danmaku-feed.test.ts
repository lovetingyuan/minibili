import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/api/danmaku", () => ({
  DANMAKU_SEGMENT_SECONDS: 360,
  fetchDanmakuSegment: vi.fn(),
}));

import { fetchDanmakuSegment } from "@/api/danmaku";
import type { DanmakuItem } from "@/api/danmaku.types";

import {
  createDanmakuFeedState,
  DANMAKU_SEGMENT_RETRY_DELAYS_MS,
  mergeDanmakuSegmentItems,
  requestDanmakuSegment,
  resetDanmakuFeedState,
  resolveDanmakuSegmentWindow,
} from "./danmaku-feed";

const mockedFetch = vi.mocked(fetchDanmakuSegment);

function createItem(progressMs: number, content = "你好"): DanmakuItem {
  return { progressMs, content, color: 0xffffff, fontsize: 25 };
}

beforeEach(() => {
  mockedFetch.mockReset();
  mockedFetch.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("resolveDanmakuSegmentWindow", () => {
  test("keeps the current segment plus the next one", () => {
    expect(resolveDanmakuSegmentWindow(0)).toEqual({ currentIndex: 0, prefetchIndex: 1 });
    expect(resolveDanmakuSegmentWindow(359_999)).toEqual({ currentIndex: 0, prefetchIndex: 1 });
    expect(resolveDanmakuSegmentWindow(360_000)).toEqual({ currentIndex: 1, prefetchIndex: 2 });
    expect(resolveDanmakuSegmentWindow(-1000)).toEqual({ currentIndex: 0, prefetchIndex: 1 });
  });
});

describe("mergeDanmakuSegmentItems", () => {
  test("appends a later segment without touching existing items", () => {
    const existing = [createItem(0), createItem(100)];
    const merged = mergeDanmakuSegmentItems(existing, [createItem(200)]);

    expect(merged.map((item) => item.progressMs)).toEqual([0, 100, 200]);
    expect(merged[0]).toBe(existing[0]);
    expect(mergeDanmakuSegmentItems(existing, [])).toBe(existing);
  });

  test("re-sorts when a segment arrives out of order", () => {
    const merged = mergeDanmakuSegmentItems([createItem(200)], [createItem(50)]);

    expect(merged.map((item) => item.progressMs)).toEqual([50, 200]);
  });
});

describe("requestDanmakuSegment", () => {
  test("requests each segment only once", async () => {
    const state = createDanmakuFeedState(1);

    await Promise.all([
      requestDanmakuSegment(state, 0, vi.fn()),
      requestDanmakuSegment(state, 0, vi.fn()),
    ]);
    await requestDanmakuSegment(state, 0, vi.fn());

    expect(mockedFetch).toHaveBeenCalledOnce();
    expect(state.segments.has(0)).toBe(true);
  });

  test("keeps the in-flight result after the window moves on", async () => {
    const state = createDanmakuFeedState(9);
    const notify = vi.fn();
    let resolveFirst: (items: DanmakuItem[]) => void = () => {};
    mockedFetch.mockImplementationOnce(
      () =>
        new Promise<DanmakuItem[]>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    mockedFetch.mockResolvedValue([createItem(400_000)]);

    // 分段 0 还在飞的时候跳到分段 1（旧实现会在这里丢掉分段 0 的数据）
    const firstSegment = requestDanmakuSegment(state, 0, notify);
    const secondSegment = requestDanmakuSegment(state, 1, notify);
    await secondSegment;
    resolveFirst([createItem(10)]);
    await firstSegment;

    expect(state.items.map((item) => item.progressMs)).toEqual([10, 400_000]);
    expect(state.segments.has(0)).toBe(true);
    expect(notify).toHaveBeenCalledTimes(2);
  });

  test("retries a failed request and keeps the data once it succeeds", async () => {
    vi.useFakeTimers();
    const state = createDanmakuFeedState(1);
    const notify = vi.fn();
    mockedFetch
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([createItem(100)]);

    const task = requestDanmakuSegment(state, 0, notify);
    await vi.advanceTimersByTimeAsync(DANMAKU_SEGMENT_RETRY_DELAYS_MS[0]);
    await task;

    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(state.items).toHaveLength(1);
    expect(notify).toHaveBeenCalledOnce();
  });

  test("gives up after the retries and can be requested again later", async () => {
    vi.useFakeTimers();
    const state = createDanmakuFeedState(1);
    mockedFetch.mockRejectedValue(new Error("network"));

    const task = requestDanmakuSegment(state, 0, vi.fn());
    await vi.runAllTimersAsync();
    await task;

    expect(mockedFetch).toHaveBeenCalledTimes(1 + DANMAKU_SEGMENT_RETRY_DELAYS_MS.length);
    expect(state.pending.size).toBe(0);
    expect(state.segments.has(0)).toBe(false);

    mockedFetch.mockResolvedValue([createItem(100)]);
    await requestDanmakuSegment(state, 0, vi.fn());

    expect(state.segments.has(0)).toBe(true);
    expect(state.items).toHaveLength(1);
  });

  test("drops the in-flight result after the player switches to another page", async () => {
    const state = createDanmakuFeedState(1);
    const notify = vi.fn();
    let resolveFirst: (items: DanmakuItem[]) => void = () => {};
    mockedFetch.mockImplementationOnce(
      () =>
        new Promise<DanmakuItem[]>((resolve) => {
          resolveFirst = resolve;
        }),
    );

    const task = requestDanmakuSegment(state, 0, notify);
    resetDanmakuFeedState(state, 2);
    resolveFirst([createItem(10)]);
    await task;

    expect(state.items).toEqual([]);
    expect(state.segments.has(0)).toBe(false);
    expect(notify).not.toHaveBeenCalled();
  });
});
