import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { WatchProgressMap } from "../api/watch-progress.types";

const state = vi.hoisted(() => ({
  map: {} as Record<string, { ratio: number; updatedAt: number }>,
  writes: 0,
}));

vi.mock(".", () => ({
  getStoreMethods: () => ({
    getWatchProgressMap: () => state.map,
    setWatchProgressMap: (next: Record<string, { ratio: number; updatedAt: number }>) => {
      state.map = next;
      state.writes += 1;
    },
  }),
  useStore: () => ({ watchProgressMap: state.map }),
}));

import {
  clearWatchProgress,
  mergeWatchProgress,
  recordLocalWatchProgress,
  replaceWatchProgress,
  useWatchProgressRatio,
} from "./watch-progress";

function api(ratio: number, updatedAt = 1000) {
  return { ratio, updatedAt };
}

beforeEach(() => {
  state.map = {};
  state.writes = 0;
});

describe("watch progress map", () => {
  test("replaces the map and skips redundant writes", () => {
    replaceWatchProgress({ BV1: api(0.5), BV2: api(1) });
    expect(state.map).toEqual({ BV1: api(0.5), BV2: api(1) });
    replaceWatchProgress({ BV2: api(1), BV1: api(0.5) });
    expect(state.writes).toBe(1);
    replaceWatchProgress({ BV1: api(0.25) });
    expect(state.map).toEqual({ BV1: api(0.25) });
    expect(state.writes).toBe(2);
    replaceWatchProgress({ BV1: api(0.25, 2000) });
    expect(state.writes).toBe(3);
    replaceWatchProgress({ BV1: api(0.25, 2000) });
    expect(state.writes).toBe(3);
  });

  test("drops empty bvids and unusable ratios", () => {
    replaceWatchProgress({
      "": api(0.5),
      " ": api(0.5),
      BV1: api(Number.NaN),
      BV2: api(0.5, Number.NaN),
      BV3: api(0.5),
    });
    expect(state.map).toEqual({ BV3: api(0.5) });
  });

  test("merges only the records it fetched", () => {
    replaceWatchProgress({ BV1: api(0.5), BV2: api(0.5) });
    mergeWatchProgress({ BV2: api(0.8, 3000) });
    expect(state.map).toEqual({ BV1: api(0.5), BV2: api(0.8, 3000) });
    expect(state.writes).toBe(2);

    mergeWatchProgress({});
    mergeWatchProgress({ BV2: api(0.8, 3000) });
    expect(state.writes).toBe(2);
  });

  test("keeps the newer local progress when the server result is older", () => {
    state.map = { BV1: api(0.4, 5000) } satisfies WatchProgressMap;
    mergeWatchProgress({ BV1: api(0.1, 4000), BV2: api(0.5, 4000) });
    expect(state.map).toEqual({ BV1: api(0.4, 5000), BV2: api(0.5, 4000) });

    // 服务端记录的时间和本地写入落在同一秒（历史接口只精确到秒），也保留本地值
    mergeWatchProgress({ BV1: api(0.2, 5000) });
    expect(state.map.BV1).toEqual(api(0.4, 5000));

    // 服务端确实更新过（含重看后进度回退），以服务端为准
    mergeWatchProgress({ BV1: api(0.2, 6000) });
    expect(state.map.BV1).toEqual(api(0.2, 6000));
  });

  test("never writes a snapshot without progress", () => {
    mergeWatchProgress({ BV1: api(0, 9000), BV2: api(0, 9000) });
    expect(state.map).toEqual({});
    expect(state.writes).toBe(0);

    replaceWatchProgress({ BV1: api(0.5) });
    mergeWatchProgress({ BV2: api(0, 9000) });
    expect(state.map).toEqual({ BV1: api(0.5) });
  });

  test("clears the map only when it is not empty", () => {
    clearWatchProgress();
    expect(state.writes).toBe(0);
    replaceWatchProgress({ BV1: api(0.5) });
    clearWatchProgress();
    expect(state.map).toEqual({});
    expect(state.writes).toBe(2);
  });
});

describe("locally recorded watch progress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1789486400_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("writes the ratio the player already knows", () => {
    recordLocalWatchProgress(" BV1 ", 0.05);
    expect(state.map).toEqual({ BV1: api(0.05, 1789486400_000) });

    recordLocalWatchProgress("BV2", 1.4);
    expect(state.map.BV2).toEqual(api(1, 1789486400_000));
    expect(state.writes).toBe(2);
  });

  test("ignores unusable bvids and ratios", () => {
    recordLocalWatchProgress("  ", 0.5);
    recordLocalWatchProgress("BV1", 0);
    recordLocalWatchProgress("BV1", -1);
    recordLocalWatchProgress("BV1", Number.NaN);
    expect(state.map).toEqual({});
    expect(state.writes).toBe(0);
  });

  test("wins over a stale server refresh on the same second", () => {
    recordLocalWatchProgress("BV1", 0.05);
    mergeWatchProgress({ BV1: api(0, 1789486400) });
    expect(state.map.BV1).toEqual(api(0.05, 1789486400_000));
  });
});

describe("cover progress ratio", () => {
  test("reads the ratio of the video from the history map", () => {
    state.map = { BV1: api(0.4) } satisfies WatchProgressMap;
    expect(useWatchProgressRatio("BV1")).toBe(0.4);
    expect(useWatchProgressRatio("BV2")).toBe(0);
  });
});
