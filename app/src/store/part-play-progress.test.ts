import { beforeEach, describe, expect, test, vi } from "vitest";

import type { PartPlayProgressMap } from "./part-play-progress.types";

const state = vi.hoisted(() => ({
  map: {} as PartPlayProgressMap,
  writes: 0,
}));

vi.mock(".", () => ({
  getStoreMethods: () => ({
    get$partPlayProgressMap: () => state.map,
    set$partPlayProgressMap: (next: PartPlayProgressMap) => {
      state.map = next;
      state.writes += 1;
    },
  }),
  useStore: () => ({ $partPlayProgressMap: state.map }),
}));

import {
  clearPartPlayProgress,
  getPartPlayProgressKey,
  PART_PLAY_PROGRESS_MIN_MS,
  recordPartPlayProgress,
  resolvePartPlayProgressPositionMs,
  usePartPlayProgressPosition,
} from "./part-play-progress";

beforeEach(() => {
  state.map = {};
  state.writes = 0;
});

describe("part play progress", () => {
  test("stores and reads each bvid:cid independently", () => {
    recordPartPlayProgress(" BV1 ", 101, 20_000, 60_000, 1000);
    recordPartPlayProgress("BV1", 102, 30_000, 90_000, 2000);

    expect(state.map).toEqual({
      "BV1:101": { positionMs: 20_000, durationMs: 60_000, updatedAt: 1000 },
      "BV1:102": { positionMs: 30_000, durationMs: 90_000, updatedAt: 2000 },
    });
    expect(resolvePartPlayProgressPositionMs(state.map, "BV1", 101)).toBe(20_000);
    expect(usePartPlayProgressPosition("BV1", 102)).toBe(30_000);
  });

  test("ignores invalid and insignificant positions", () => {
    recordPartPlayProgress("", 101, 20_000, 60_000);
    recordPartPlayProgress("BV1", 0, 20_000, 60_000);
    recordPartPlayProgress("BV1", 101, PART_PLAY_PROGRESS_MIN_MS - 1, 60_000);
    recordPartPlayProgress("BV1", 101, 60_000, 60_000);
    recordPartPlayProgress("BV1", 101, 20_000, 0);
    expect(state.map).toEqual({});
    expect(state.writes).toBe(0);
  });

  test("rejects malformed persisted snapshots", () => {
    state.map = {
      "BV1:101": { positionMs: Number.NaN, durationMs: 60_000, updatedAt: 1000 },
      "BV1:102": { positionMs: 60_000, durationMs: 60_000, updatedAt: 1000 },
    };
    expect(resolvePartPlayProgressPositionMs(state.map, "BV1", 101)).toBeNull();
    expect(resolvePartPlayProgressPositionMs(state.map, "BV1", 102)).toBeNull();
    expect(resolvePartPlayProgressPositionMs(state.map, "BV1", 999)).toBeNull();
  });

  test("clears only the completed part", () => {
    recordPartPlayProgress("BV1", 101, 20_000, 60_000, 1000);
    recordPartPlayProgress("BV1", 102, 30_000, 90_000, 2000);
    clearPartPlayProgress("BV1", 101);

    expect(state.map).toEqual({
      "BV1:102": { positionMs: 30_000, durationMs: 90_000, updatedAt: 2000 },
    });
    clearPartPlayProgress("BV1", 101);
    expect(state.writes).toBe(3);
  });

  test("builds keys only for valid parts", () => {
    expect(getPartPlayProgressKey(" BV1 ", 101)).toBe("BV1:101");
    expect(getPartPlayProgressKey("", 101)).toBeNull();
    expect(getPartPlayProgressKey("BV1", 0)).toBeNull();
  });
});
