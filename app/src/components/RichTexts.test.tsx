import { describe, expect, test } from "vitest";

import { getRichTextsContainerClassName } from "./rich-texts.helpers";

describe("RichTexts 正文容器", () => {
  test("保持内容撑开高度，不能带 flex-1", () => {
    expect(getRichTextsContainerClassName(false)).toBe("mb-3");
    expect(getRichTextsContainerClassName(true)).toBe("mb-4");
    expect(getRichTextsContainerClassName(true, "extra")).toBe("mb-4 extra");

    // 回归护栏：动态详情页把卡片放在评论列表 ListHeaderComponent 里，评论行挂载后 FlashList 会重排头部；
    // 容器一旦是 flex-1（flexBasis: 0），整块话题+正文会被算成 0 高，表现为文案先出现再消失。
    expect(getRichTextsContainerClassName(false)).not.toContain("flex-1");
    expect(getRichTextsContainerClassName(true)).not.toContain("flex-1");
  });
});
