import { describe, expect, test } from "vitest";

import { shouldSignWbiRequest } from "./fetcher";
import {
  buildSpaceContentCountsUrl,
  buildSpaceOpusUrl,
  buildSpaceVideoUrl,
  dedupeSpaceItems,
  getSpaceOpusPageKey,
  getSpaceVideoPageKey,
  mapSpaceOpusItem,
  mapSpaceVideoItem,
  parseOpusPubTs,
  splitEmoteRichTextNodes,
  SPACE_VIDEO_PAGE_SIZE,
} from "./space-items.mapper";
import {
  SpaceContentCountsSchema,
  SpaceOpusItemSchema,
  SpaceOpusPageSchema,
  SpaceVideoItemSchema,
  SpaceVideoPageSchema,
} from "./space-items.schema";

const owner = {
  mid: 26798384,
  name: "柴知道",
  face: "https://i2.hdslb.com/face.jpg",
};

test("maps the space navigation counts used by the tabs", () => {
  expect(buildSpaceContentCountsUrl(owner.mid)).toBe("/x/space/navnum?mid=26798384");
  expect(
    SpaceContentCountsSchema.parse({ video: 513, article: 16, album: 353, opus: "366" }),
  ).toEqual({
    video: 513,
    article: 16,
    album: 353,
    opus: 366,
  });
});

function videoFixture(overrides: Record<string, unknown> = {}) {
  return SpaceVideoItemSchema.parse({
    comment: 1341,
    play: 216200,
    pic: "http://i0.hdslb.com/bfs/archive/cover.jpg",
    description: "视频简介",
    title: "视频标题",
    author: "柴知道",
    mid: 26798384,
    created: 1789637400,
    length: "08:24",
    video_review: 358,
    aid: 117285155115380,
    bvid: "BV1YWeg6TEjT",
    ...overrides,
  });
}

function opusFixture(overrides: Record<string, unknown> = {}) {
  return SpaceOpusItemSchema.parse({
    jump_url: "//www.bilibili.com/opus/1248956735001985107",
    opus_id: "1248956735001985107",
    content: "今天讲一个每天都会刷到的东西。",
    cover: {
      url: "http://i0.hdslb.com/bfs/new_dyn/cover.png",
      width: 1920,
      height: 1080,
    },
    stat: { view: "", like: "752" },
    pub_time: "",
    ...overrides,
  });
}

describe("space video API", () => {
  test("builds the verified newest-first URL and page keys", () => {
    const url = buildSpaceVideoUrl(26798384, 2);
    const query = new URLSearchParams(url.split("?")[1]);

    expect(url).toContain("/x/space/wbi/arc/search?");
    expect(query.get("mid")).toBe("26798384");
    expect(query.get("pn")).toBe("2");
    expect(query.get("ps")).toBe("40");
    expect(query.get("order")).toBe("pubdate");
    expect(query.get("tid")).toBe("0");
    expect(query.get("order_avoided")).toBe("true");

    const fullPage = SpaceVideoPageSchema.parse({
      list: {
        vlist: Array.from({ length: SPACE_VIDEO_PAGE_SIZE }, (_, index) =>
          videoFixture({ aid: index + 1, bvid: `BV${index + 1}` }),
        ),
      },
    });
    const lastPage = SpaceVideoPageSchema.parse({ list: { vlist: [videoFixture()] } });

    expect(getSpaceVideoPageKey(26798384, 1, fullPage)).toContain("pn=2");
    expect(getSpaceVideoPageKey(26798384, 1, lastPage)).toBeNull();
  });

  test("maps real video fields and keeps the collaboration author", () => {
    const normal = mapSpaceVideoItem(videoFixture(), owner);
    const collaboration = mapSpaceVideoItem(
      videoFixture({
        aid: 2,
        bvid: "BV1COLLAB",
        author: "医健三连充电站",
        mid: 1042757514,
      }),
      owner,
    );

    expect(normal).toMatchObject({
      author: { mid: 26798384, name: "柴知道", face: owner.face },
      time: 1789637400,
      content: {
        kind: "video",
        aid: 117285155115380,
        bvid: "BV1YWeg6TEjT",
        cover: "https://i0.hdslb.com/bfs/archive/cover.jpg",
        duration: "08:24",
        play: 216200,
        danmaku: 358,
      },
      stats: { comment: 1341 },
    });
    expect(collaboration.author).toEqual({
      mid: 1042757514,
      name: "医健三连充电站",
      face: "",
    });
    expect(collaboration.pubAction).toBe("合作投稿");
    expect(dedupeSpaceItems([normal, normal, collaboration]).map((item) => item.id)).toEqual([
      normal.id,
      collaboration.id,
    ]);
  });
});

describe("space opus API", () => {
  test("builds the all-opus URL with page and previous offset", () => {
    const url = buildSpaceOpusUrl(26798384, 2, "1139879385483968513");
    const query = new URLSearchParams(url.split("?")[1]);

    expect(query.get("host_mid")).toBe("26798384");
    expect(query.get("page")).toBe("2");
    expect(query.get("offset")).toBe("1139879385483968513");
    expect(query.get("type")).toBe("all");

    const page = SpaceOpusPageSchema.parse({
      items: [opusFixture()],
      offset: "next-offset",
      has_more: true,
    });
    expect(getSpaceOpusPageKey(26798384, 1, page)).toContain("offset=next-offset");
    expect(
      getSpaceOpusPageKey(
        26798384,
        1,
        SpaceOpusPageSchema.parse({ items: [], offset: "", has_more: false }),
      ),
    ).toBeNull();
  });

  test("maps image and text opus items into dynamic cards", () => {
    const image = mapSpaceOpusItem(opusFixture(), owner);
    const text = mapSpaceOpusItem(
      opusFixture({ opus_id: "2", jump_url: "", cover: null, stat: { view: 0, like: 12 } }),
      owner,
    );

    expect(image).toMatchObject({
      id: "1248956735001985107",
      sourceType: "DYNAMIC_TYPE_DRAW",
      time: 1789633800,
      text: "今天讲一个每天都会刷到的东西。",
      content: {
        kind: "images",
        images: [
          {
            src: "https://i0.hdslb.com/bfs/new_dyn/cover.png",
            width: 1920,
            height: 1080,
            ratio: 1920 / 1080,
          },
        ],
      },
      stats: { like: 752 },
      url: "https://www.bilibili.com/opus/1248956735001985107",
    });
    // 只显示到「日」，不带小时分钟；同年省略年份。
    expect(image.date).toMatch(/^(2026-)?09-17$/);
    expect(image.date).not.toMatch(/\d{2}:\d{2}/);
    expect(text).toMatchObject({
      id: "2",
      sourceType: "DYNAMIC_TYPE_WORD",
      time: 0,
      date: "",
      content: { kind: "text" },
      stats: { like: 12 },
      url: "https://www.bilibili.com/opus/2",
    });
  });

  test("derives the publish time from the opus snowflake id", () => {
    // 期望值取自 https://www.bilibili.com/opus/<id> 页面显示的发布时间（+08:00）。
    expect(parseOpusPubTs("1248956735001985107")).toBe(1789633800);
    expect(parseOpusPubTs("1139879385483968513")).toBe(1764237251);
    expect(parseOpusPubTs("1169976373095170050")).toBe(1771244752);

    // 接口若返回数字会先丢精度，但高 32 位不受影响，仍然解得出同一时间。
    expect(parseOpusPubTs(Number("1248956735001985107"))).toBe(1789633800);

    // 非雪花 ID 或空值不做猜测，避免显示错误的时间。
    expect(parseOpusPubTs("")).toBe(0);
    expect(parseOpusPubTs("2")).toBe(0);
    expect(parseOpusPubTs("abc")).toBe(0);
  });

  test("deduplicates overlapping pages and signs the opus endpoint", () => {
    const first = mapSpaceOpusItem(opusFixture(), owner);
    const second = mapSpaceOpusItem(opusFixture({ opus_id: "2" }), owner);

    expect(dedupeSpaceItems([first, first, second]).map((item) => item.id)).toEqual([
      "1248956735001985107",
      "2",
    ]);
    expect(shouldSignWbiRequest(buildSpaceOpusUrl(owner.mid, 1))).toBe(true);
  });

  test("splits the plain text emoji tags of the opus feed into rich text nodes", () => {
    // 图文接口只给纯文本，[大哭] 这类标签要按表情包的名字映射补上图片地址。
    const emoteMap = new Map([
      ["[大哭]", "https://i0.hdslb.com/bfs/emote/daku.png"],
      ["[保卫萝卜_哇]", "https://i0.hdslb.com/bfs/emote/luobo.png"],
    ]);
    const nodes = splitEmoteRichTextNodes("彪哥[大哭][大哭]，不行[未知表情]了", emoteMap);

    expect(nodes).toEqual([
      { type: "RICH_TEXT_NODE_TYPE_TEXT", text: "彪哥" },
      {
        type: "RICH_TEXT_NODE_TYPE_EMOJI",
        text: "[大哭]",
        orig_text: "[大哭]",
        emoji: { icon_url: "https://i0.hdslb.com/bfs/emote/daku.png", text: "[大哭]" },
      },
      {
        type: "RICH_TEXT_NODE_TYPE_EMOJI",
        text: "[大哭]",
        orig_text: "[大哭]",
        emoji: { icon_url: "https://i0.hdslb.com/bfs/emote/daku.png", text: "[大哭]" },
      },
      // 表情包里没有的标签保持原样，渲染层会按普通文本显示。
      { type: "RICH_TEXT_NODE_TYPE_TEXT", text: "，不行[未知表情]了" },
    ]);
  });

  test("keeps the raw emoji tags when the emote map is unavailable", () => {
    expect(splitEmoteRichTextNodes("彪哥[大哭]")).toEqual([
      { type: "RICH_TEXT_NODE_TYPE_TEXT", text: "彪哥[大哭]" },
    ]);
    expect(splitEmoteRichTextNodes("")).toEqual([]);
  });

  test("maps opus content with the emote map into renderable emoji nodes", () => {
    const item = mapSpaceOpusItem(
      opusFixture({ content: "彪哥[大哭]" }),
      owner,
      new Map([["[大哭]", "https://i0.hdslb.com/bfs/emote/daku.png"]]),
    );

    expect(item.text).toBe("彪哥[大哭]");
    expect(item.richTextNodes).toEqual([
      { type: "RICH_TEXT_NODE_TYPE_TEXT", text: "彪哥" },
      {
        type: "RICH_TEXT_NODE_TYPE_EMOJI",
        text: "[大哭]",
        orig_text: "[大哭]",
        emoji: { icon_url: "https://i0.hdslb.com/bfs/emote/daku.png", text: "[大哭]" },
      },
    ]);
  });
});
