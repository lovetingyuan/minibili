import { describe, expect, test } from "vitest";

import type { DanmakuItem } from "@/api/danmaku.types";

import {
  DANMAKU_SCROLL_DURATION_MS,
  estimateDanmakuWidth,
  findVisibleStartIndex,
  isDanmakuLayoutFresh,
  mergeDanmakuItems,
  resolveDanmakuAnimation,
  resolveDanmakuLaneCount,
  resolveDanmakuLaneFreeAt,
  resolveDanmakuLaneHeight,
  resolveDanmakuLayout,
  resolveDanmakuSpeed,
  resolveDanmakuX,
  selectVisibleDanmaku,
  toDanmakuColor,
} from "./danmaku-track";

function createItem(progressMs: number, content = "你好"): DanmakuItem {
  return { progressMs, content, color: 0xffffff, fontsize: 25 };
}

const layoutOptions = { containerWidth: 400, containerHeight: 100, fontSize: 16, laneHeight: 27 };

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
    expect(resolveDanmakuLaneHeight(15)).toBe(26);
    expect(resolveDanmakuLaneHeight(18)).toBe(31);
  });
});

describe("danmaku movement", () => {
  test("resumes from the latest timeline position with the remaining duration", () => {
    expect(
      resolveDanmakuAnimation({ currentX: 120, endX: -60, durationMs: 7000, elapsedMs: 3000 }, 1),
    ).toEqual({ startX: 120, endX: -60, durationMs: 4000 });
    expect(
      resolveDanmakuAnimation({ currentX: 120, endX: -60, durationMs: 7000, elapsedMs: 3000 }, 2),
    ).toEqual({ startX: 120, endX: -60, durationMs: 2000 });
    expect(
      resolveDanmakuAnimation({ currentX: 120, endX: -60, durationMs: 7000, elapsedMs: 3000 }, 0.5),
    ).toEqual({ startX: 120, endX: -60, durationMs: 8000 });
  });

  test("finishes an expired danmaku without restarting an animation", () => {
    expect(
      resolveDanmakuAnimation({ currentX: -60, endX: -60, durationMs: 7000, elapsedMs: 7000 }, 1),
    ).toEqual({ startX: -60, endX: -60, durationMs: 0 });
  });

  test("keeps the whole traverse duration for every text width", () => {
    // (400 + 32) / 7s = 61.7px/s，与文本宽度无关的定长模型
    expect(Math.round(resolveDanmakuSpeed(400, 32))).toBe(62);
    expect(Math.round(resolveDanmakuSpeed(400, 320))).toBe(103);
  });

  test("places a danmaku outside the right edge at its own timestamp", () => {
    expect(resolveDanmakuX(0, 32, 400, 0)).toBe(400);
    expect(resolveDanmakuX(0, 32, 400, -500)).toBe(400);
    expect(Math.round(resolveDanmakuX(0, 32, 400, 3500))).toBe(184);
  });

  test("finishes the traverse exactly when the tail leaves the left edge", () => {
    expect(resolveDanmakuX(0, 32, 400, DANMAKU_SCROLL_DURATION_MS)).toBe(-32);
    expect(resolveDanmakuX(0, 320, 400, DANMAKU_SCROLL_DURATION_MS)).toBe(-320);
    expect(resolveDanmakuX(0, 32, 400, DANMAKU_SCROLL_DURATION_MS + 1000)).toBe(-32);
  });

  test("frees a lane once the previous tail has entered the screen", () => {
    // 0 + 7s * 32 / 432 ≈ 518ms
    expect(Math.round(resolveDanmakuLaneFreeAt(0, 32, 400))).toBe(519);
  });
});

describe("resolveDanmakuLayout", () => {
  test("assigns free lanes in order and is independent of playback time", () => {
    const items = [createItem(0), createItem(100), createItem(200)];
    const first = resolveDanmakuLayout(items, layoutOptions);
    const second = resolveDanmakuLayout(items, layoutOptions);

    expect([...first.lanes]).toEqual([0, 1, 2]);
    expect([...second.lanes]).toEqual([...first.lanes]);
    expect(first.laneCount).toBe(3);
  });

  test("drops danmaku once every lane is busy", () => {
    const items = [
      createItem(0),
      createItem(10),
      createItem(20),
      createItem(30, "一条很长的弹幕内容"),
    ];

    expect([...resolveDanmakuLayout(items, layoutOptions).lanes]).toEqual([0, 1, 2, -1]);
  });

  test("reuses a lane after the previous tail has cleared the right edge", () => {
    const items = [createItem(0), createItem(600)];
    const lanes = resolveDanmakuLayout(items, { ...layoutOptions, containerHeight: 27 }).lanes;

    // 第一条在 519ms 后让出轨道，600ms 的弹幕可以复用同一条
    expect([...lanes]).toEqual([0, 0]);
  });

  test("recomputes lanes when the container changes", () => {
    const items = [createItem(0), createItem(10), createItem(20)];
    const single = resolveDanmakuLayout(items, { ...layoutOptions, containerHeight: 27 });

    expect([...single.lanes]).toEqual([0, -1, -1]);
    expect(isDanmakuLayoutFresh(single, layoutOptions)).toBe(false);
    expect(isDanmakuLayoutFresh(single, { ...layoutOptions, containerHeight: 27 })).toBe(true);
  });

  test("drops everything when the container is not measurable yet", () => {
    const items = [createItem(0)];

    expect([...resolveDanmakuLayout(items, { ...layoutOptions, containerWidth: 0 }).lanes]).toEqual(
      [-1],
    );
  });
});

describe("findVisibleStartIndex", () => {
  const items = [createItem(0), createItem(100), createItem(200)];

  test("locates the first danmaku not older than the given time", () => {
    expect(findVisibleStartIndex(items, 0)).toBe(0);
    expect(findVisibleStartIndex(items, 150)).toBe(2);
    expect(findVisibleStartIndex(items, 200)).toBe(2);
    expect(findVisibleStartIndex(items, 1000)).toBe(3);
  });
});

describe("mergeDanmakuItems", () => {
  test("merges two sorted lists and keeps the original reference when empty", () => {
    const items = [createItem(0), createItem(200, "网络")];
    const merged = mergeDanmakuItems(items, [createItem(100, "本地"), createItem(300, "本地2")]);

    expect(merged.map((item) => item.progressMs)).toEqual([0, 100, 200, 300]);
    expect(mergeDanmakuItems(items, [])).toBe(items);
  });
});

describe("selectVisibleDanmaku", () => {
  const items = [createItem(0, "第一条"), createItem(1000, "第二条"), createItem(2500, "第三条")];
  const layout = resolveDanmakuLayout(items, layoutOptions);

  test("renders danmaku by their own timestamp", () => {
    const visible = selectVisibleDanmaku(items, layout, { currentTimeMs: 0, anchorTimeMs: 0 });

    expect(visible).toHaveLength(1);
    expect(visible[0].content).toBe("第一条");
    expect(visible[0].currentX).toBe(400);
    expect(visible[0].elapsedMs).toBe(0);
    expect(visible[0].endX).toBe(-48);
    expect(visible[0].durationMs).toBe(DANMAKU_SCROLL_DURATION_MS);
  });

  test("keeps already flying danmaku inside the window and drops expired ones", () => {
    const flying = selectVisibleDanmaku(items, layout, {
      currentTimeMs: 6000,
      anchorTimeMs: 0,
    });
    expect(flying.map((item) => item.content)).toEqual(["第一条", "第二条", "第三条"]);
    expect(flying[0].elapsedMs).toBe(6000);

    const expired = selectVisibleDanmaku(items, layout, {
      currentTimeMs: DANMAKU_SCROLL_DURATION_MS + 1,
      anchorTimeMs: 0,
    });
    expect(expired.map((item) => item.content)).toEqual(["第二条", "第三条"]);
    expect(expired[0].elapsedMs).toBe(DANMAKU_SCROLL_DURATION_MS + 1 - 1000);
  });

  test("does not backfill danmaku from before the anchor", () => {
    // 跳到 2000ms：窗口 [2000, 2500] 内只有 2500ms 的弹幕，
    // 更早的两条虽然还在全程时长内，也不补画
    const forwarded = selectVisibleDanmaku(items, layout, {
      currentTimeMs: 2500,
      anchorTimeMs: 2000,
    });
    expect(forwarded.map((item) => item.content)).toEqual(["第三条"]);
    expect(forwarded[0].elapsedMs).toBe(0);

    const resumed = selectVisibleDanmaku(items, layout, {
      currentTimeMs: 3500,
      anchorTimeMs: 2000,
    });
    expect(resumed.map((item) => item.content)).toEqual(["第三条"]);
    expect(resumed[0].elapsedMs).toBe(1000);
  });

  test("ignores danmaku without a lane and mismatched layouts", () => {
    const crowded = [
      createItem(0),
      createItem(1, "第一条"),
      createItem(2, "第二条"),
      createItem(3, "第三条"),
    ];
    const crowdedLayout = resolveDanmakuLayout(crowded, layoutOptions);
    const visible = selectVisibleDanmaku(crowded, crowdedLayout, {
      currentTimeMs: 10,
      anchorTimeMs: 0,
    });

    expect(visible.map((item) => item.content)).toEqual(["你好", "第一条", "第二条"]);
    expect(
      selectVisibleDanmaku(
        items,
        { ...layout, lanes: new Int16Array(1) },
        {
          currentTimeMs: 0,
          anchorTimeMs: 0,
        },
      ),
    ).toEqual([]);
  });
});
