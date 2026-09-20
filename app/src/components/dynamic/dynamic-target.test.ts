import { describe, expect, test } from "vitest";

import type { DynamicItem } from "@/api/dynamic-items.type";
import { getDynamicDetailTarget, getDynamicVideoTarget } from "./dynamic-target";

const baseItem = {
  id: "dynamic-1",
  sourceType: "DYNAMIC_TYPE_WORD",
  author: { mid: "42", name: "UP", face: "face.jpg" },
  date: "刚刚",
  time: 0,
  pubAction: "发布了动态",
  top: false,
  title: "",
  text: "这是一条非常长的动态正文，需要被截断成较短的标题展示",
  richTextNodes: [],
  topic: null,
  content: { kind: "text" },
  additional: null,
  commentId: "1",
  commentType: 17,
  stats: { comment: 0, like: 0, forward: 0 },
  url: "",
  original: null,
} satisfies DynamicItem;

const videoContent = {
  kind: "video",
  aid: 2,
  bvid: "BV1TEST",
  cover: "cover.jpg",
  title: "视频标题",
  description: "视频简介",
  duration: "01:30",
  play: 100,
  danmaku: 20,
} as const;

describe("dynamic open target", () => {
  test("opens video submissions in the player", () => {
    expect(getDynamicVideoTarget({ ...baseItem, content: videoContent })).toEqual({
      aid: 2,
      bvid: "BV1TEST",
      title: "视频标题",
      desc: "视频简介",
      cover: "cover.jpg",
      mid: "42",
      name: "UP",
      face: "face.jpg",
    });
  });

  test("keeps text dynamics on the detail page with a truncated title", () => {
    const target = getDynamicDetailTarget(baseItem);
    expect(target.dynamicId).toBe("dynamic-1");
    expect(target.title).toHaveLength(24);
    expect(target.user).toEqual({ mid: "42", name: "UP" });
  });

  test("prefers the author passed by the caller and falls back for empty text", () => {
    const user = { mid: 7, name: "其他 UP" };
    expect(getDynamicDetailTarget({ ...baseItem, text: "" }, user).user).toEqual(user);
    expect(getDynamicDetailTarget({ ...baseItem, text: "" }).title).toBe("动态详情");
  });

  test("treats videos without a bvid as detail-only", () => {
    expect(getDynamicVideoTarget({ ...baseItem, content: { ...videoContent, bvid: "" } })).toBeNull();
    expect(getDynamicVideoTarget({ ...baseItem, content: { kind: "text" } })).toBeNull();
  });
});
