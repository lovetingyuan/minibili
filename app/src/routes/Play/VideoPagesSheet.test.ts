import { describe, expect, test } from "vitest";

import { formatVideoPageTitle, getVideoPagesSheetHeight } from "./video-pages-sheet.helpers";

describe("video pages sheet", () => {
  test("strips only the duplicated page prefix", () => {
    expect(formatVideoPageTitle("28. 水星记 - 郭顶", 28)).toBe("水星记 - 郭顶");
    expect(formatVideoPageTitle("03. 江南 - 林俊杰", 3)).toBe("江南 - 林俊杰");
    expect(formatVideoPageTitle("P28：水星记 - 郭顶", 28)).toBe("水星记 - 郭顶");
    expect(formatVideoPageTitle("28天", 28)).toBe("28天");
    expect(formatVideoPageTitle("水星记 - 郭顶", 28)).toBe("水星记 - 郭顶");
  });

  test("sizes short lists to content and caps long lists at 60 percent", () => {
    expect(getVideoPagesSheetHeight(1000, 2)).toBe(196);
    expect(getVideoPagesSheetHeight(1000, 99)).toBe(600);
  });
});
