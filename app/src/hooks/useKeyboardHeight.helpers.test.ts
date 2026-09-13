import { describe, expect, test } from "vitest";

import { getKeyboardOverlap } from "./useKeyboardHeight.helpers";

describe("keyboard overlap", () => {
  test("counts the navigation bar area that android omits from height", () => {
    // 实测数据：窗口 853.33dp、键盘顶边 screenY 582.4dp、上报 height 254.93dp
    // （height 比实际遮挡高度少了一个 16dp 的导航栏）
    expect(getKeyboardOverlap({ height: 254.93, screenY: 582.4 }, 853.33)).toBe(271);
  });

  test("falls back to height when screenY is missing", () => {
    expect(getKeyboardOverlap({ height: 254.93, screenY: 0 }, 853.33)).toBe(255);
  });

  test("never returns a negative overlap", () => {
    expect(getKeyboardOverlap({ height: 0, screenY: 900 }, 853.33)).toBe(0);
  });
});
