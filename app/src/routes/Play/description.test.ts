import { describe, expect, test } from "vitest";

import {
  countVideoDescriptionChars,
  getVideoDescription,
  shouldCollapseDescription,
  VIDEO_DESCRIPTION_COLLAPSE_MAX_CHARS,
} from "./description";

describe("getVideoDescription", () => {
  test("drops missing, dash and title-only descriptions", () => {
    expect(getVideoDescription(undefined, "标题")).toBe("");
    expect(getVideoDescription(null, "标题")).toBe("");
    expect(getVideoDescription("", "标题")).toBe("");
    expect(getVideoDescription("-", "标题")).toBe("");
    expect(getVideoDescription("标题", "标题")).toBe("");
  });

  test("keeps real descriptions even without a title", () => {
    expect(getVideoDescription("简介内容", "标题")).toBe("简介内容");
    expect(getVideoDescription("简介内容", undefined)).toBe("简介内容");
  });
});

describe("shouldCollapseDescription", () => {
  test("collapses only when longer than the character limit", () => {
    const max = VIDEO_DESCRIPTION_COLLAPSE_MAX_CHARS;

    expect(shouldCollapseDescription("字".repeat(max - 1))).toBe(false);
    expect(shouldCollapseDescription("字".repeat(max))).toBe(false);
    expect(shouldCollapseDescription("字".repeat(max + 1))).toBe(true);
  });

  test("counts emoji as one visible character", () => {
    const max = VIDEO_DESCRIPTION_COLLAPSE_MAX_CHARS;
    const emoji = "😀".repeat(max);

    expect(countVideoDescriptionChars(emoji)).toBe(max);
    expect(shouldCollapseDescription(emoji)).toBe(false);
    expect(shouldCollapseDescription(`${emoji}😀`)).toBe(true);
  });

  test("never collapses descriptions that are not displayed", () => {
    expect(shouldCollapseDescription("")).toBe(false);
    expect(shouldCollapseDescription(getVideoDescription("-", "标题"))).toBe(false);
    expect(shouldCollapseDescription(getVideoDescription("标题", "标题"))).toBe(false);
  });
});
