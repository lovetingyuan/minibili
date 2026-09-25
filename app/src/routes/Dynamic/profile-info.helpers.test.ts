import { describe, expect, test } from "vitest";

import {
  hasProfileInfoOverflow,
  PROFILE_INFO_COLLAPSED_LINES,
  withProfileInfoLines,
} from "./profile-info.helpers";

describe("UP主资料折叠", () => {
  test("折叠时最多展示一行", () => {
    expect(PROFILE_INFO_COLLAPSED_LINES).toBe(1);
  });

  test("任一字段超过折叠行数时才需要详情按钮", () => {
    expect(hasProfileInfoOverflow({ official: 0, sign: 0 })).toBe(false);
    expect(hasProfileInfoOverflow({ official: 1, sign: 1 })).toBe(false);
    expect(hasProfileInfoOverflow({ official: 2, sign: 0 })).toBe(true);
    expect(hasProfileInfoOverflow({ official: 0, sign: 2 })).toBe(true);
  });

  test("行数没变时返回原引用，行数变化时返回新对象", () => {
    const lines = { official: 3, sign: 1 };

    expect(withProfileInfoLines(lines, "official", 3)).toBe(lines);
    expect(withProfileInfoLines(lines, "sign", 4)).toEqual({ official: 3, sign: 4 });
    expect(withProfileInfoLines(lines, "sign", 4)).not.toBe(lines);
  });
});
