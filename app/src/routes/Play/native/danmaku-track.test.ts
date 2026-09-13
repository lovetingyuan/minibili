import { describe, expect, test } from "vitest";

import type { DanmakuItem } from "@/api/danmaku.types";

import {
  estimateDanmakuWidth,
  findDanmakuStartIndex,
  mergeDanmakuSegments,
  resolveDanmakuBatch,
  resolveDanmakuLaneCount,
  toDanmakuColor,
} from "./danmaku-track";

function createItem(progressMs: number, content = "你好"): DanmakuItem {
  return { progressMs, content, color: 0xffffff, fontsize: 25 };
}

describe("danmaku text helpers", () => {
  test("estimates wide characters as a full font size", () => {
    expect(estimateDanmakuWidth("你好", 16)).toBe(32);
    expect(estimateDanmakuWidth("ab", 16)).toBe(18);
    expect(estimateDanmakuWidth("", 16)).toBe(0);
  });

  test("clamps colors into the rgb range", () => {
    expect(toDanmakuColor(0xff0000)).toBe("#ff0000");
    expect(toDanmakuColor(0x123456)).toBe("#123456");
    expect(toDanmakuColor(0x7fffffff)).toBe("#ffffff");
    expect(toDanmakuColor(-1)).toBe("#000000");
  });

  test("derives lane count from container height", () => {
    expect(resolveDanmakuLaneCount(100, 27)).toBe(3);
    expect(resolveDanmakuLaneCount(10, 27)).toBe(1);
  });
});

describe("resolveDanmakuBatch", () => {
  const options = {
    currentTimeMs: 250,
    containerWidth: 400,
    containerHeight: 100,
    fontSize: 16,
    laneHeight: 27,
  };

  test("assigns free lanes in order and consumes all due items", () => {
    const items = [createItem(0), createItem(100), createItem(200)];
    const result = resolveDanmakuBatch(items, 0, [], options);

    expect(result.items.map((item) => item.lane)).toEqual([0, 1, 2]);
    expect(result.items[0].top).toBe(0);
    expect(result.items[1].top).toBe(27);
    expect(result.items[0].startX).toBe(400);
    // 400 / 8s = 50px/s，(400 + 32) / 50 = 8.64s
    expect(Math.round(result.items[0].durationMs)).toBe(8640);
    expect(result.nextIndex).toBe(3);
    // 尾部离开右边缘后才能复用车道的播放时间
    expect(Math.round(result.lanes[0])).toBe(890);
  });

  test("drops danmaku when every lane is busy", () => {
    const items = [createItem(0), createItem(10), createItem(20), createItem(30)];
    const first = resolveDanmakuBatch(items, 0, [], options);
    const second = resolveDanmakuBatch(items, first.nextIndex, first.lanes, {
      ...options,
      currentTimeMs: 300,
    });

    expect(second.items).toEqual([]);
    expect(second.nextIndex).toBe(4);
  });

  test("keeps the remaining items for the next tick", () => {
    const items = [createItem(100), createItem(2000)];
    const result = resolveDanmakuBatch(items, 0, [], { ...options, currentTimeMs: 200 });

    expect(result.items).toHaveLength(1);
    expect(result.nextIndex).toBe(1);
  });
});

describe("findDanmakuStartIndex", () => {
  const items = [createItem(0), createItem(100), createItem(200)];

  test("locates the first danmaku not older than the given time", () => {
    expect(findDanmakuStartIndex(items, 0)).toBe(0);
    expect(findDanmakuStartIndex(items, 150)).toBe(2);
    expect(findDanmakuStartIndex(items, 200)).toBe(2);
    expect(findDanmakuStartIndex(items, 1000)).toBe(3);
  });
});

describe("mergeDanmakuSegments", () => {
  test("appends a later segment without moving existing indexes", () => {
    const existing = [createItem(0), createItem(100)];
    const merged = mergeDanmakuSegments(existing, [createItem(200)]);

    expect(merged.appended).toBe(true);
    expect(merged.items.map((item) => item.progressMs)).toEqual([0, 100, 200]);
    expect(merged.items[0]).toBe(existing[0]);
  });

  test("sorts and asks for a reset when a segment arrives out of order", () => {
    const merged = mergeDanmakuSegments([createItem(200)], [createItem(50)]);

    expect(merged.appended).toBe(false);
    expect(merged.items.map((item) => item.progressMs)).toEqual([50, 200]);
  });
});
