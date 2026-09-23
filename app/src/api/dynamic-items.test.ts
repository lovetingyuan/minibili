import { describe, expect, it } from "vitest";

import { buildDynamicListUrl, getDynamicPageKey, mapDynamicItem } from "./dynamic-items.mapper";
import {
  DynamicDetailResponseSchema,
  DynamicItemResponseSchema,
  DynamicListResponseSchema,
} from "./dynamic-items.schema";

type FixtureOptions = {
  id?: string;
  type?: string;
  major?: unknown;
  desc?: unknown;
  additional?: unknown;
  orig?: unknown;
  pubTs?: string | number;
  following?: boolean | number | null;
  commentId?: string | number;
  commentType?: number;
  top?: boolean;
};

function fixture(options: FixtureOptions = {}) {
  return DynamicItemResponseSchema.parse({
    id_str: options.id ?? "10001",
    type: options.type ?? "DYNAMIC_TYPE_WORD",
    basic: {
      comment_id_str: options.commentId ?? "20001",
      comment_type: options.commentType ?? 17,
    },
    modules: {
      module_author: {
        face: "//i0.hdslb.com/face.jpg",
        following: "following" in options ? options.following : null,
        mid: "42",
        name: "测试UP",
        pub_action: "投稿了动态",
        pub_time: "昨天",
        pub_ts: options.pubTs ?? "1725100000",
      },
      module_dynamic: {
        desc:
          "desc" in options
            ? options.desc
            : {
                text: "普通文字动态",
                rich_text_nodes: [{ type: "RICH_TEXT_NODE_TYPE_TEXT", text: "普通文字动态" }],
              },
        topic: { name: "测试话题", jump_url: "//www.bilibili.com/v/topic/detail/?topic_id=1" },
        major: options.major ?? {
          type: "MAJOR_TYPE_OPUS",
          opus: { summary: { text: "" }, pics: [] },
        },
        additional: options.additional,
      },
      module_tag: options.top ? { text: "置顶" } : null,
      module_stat: {
        comment: { count: 3 },
        forward: { count: 4 },
        like: { count: 5 },
      },
    },
    orig: options.orig,
  });
}

describe("dynamic item mapping", () => {
  it("maps video fields and comment parameters", () => {
    const item = mapDynamicItem(
      fixture({
        type: "DYNAMIC_TYPE_AV",
        commentId: "987654321012345678",
        commentType: 1,
        major: {
          type: "MAJOR_TYPE_ARCHIVE",
          archive: {
            aid: "170001",
            bvid: "BV1xx411c7mD",
            cover: "//i0.hdslb.com/video.jpg",
            title: "视频标题",
            desc: "视频简介",
            duration_text: "03:21",
            stat: { play: "1.2万", danmaku: "88" },
          },
        },
      }),
    );

    expect(item.content).toMatchObject({
      kind: "video",
      aid: "170001",
      bvid: "BV1xx411c7mD",
      duration: "03:21",
      play: 12000,
      danmaku: 88,
    });
    expect(item.commentId).toBe("987654321012345678");
    expect(item.commentType).toBe(1);
  });

  it("uses OPUS summary and preserves long pictures, GIFs and rich text", () => {
    const item = mapDynamicItem(
      fixture({
        type: "DYNAMIC_TYPE_DRAW",
        commentType: 11,
        top: true,
        desc: null,
        major: {
          type: "MAJOR_TYPE_OPUS",
          opus: {
            title: "",
            summary: {
              text: "图文正文",
              rich_text_nodes: [
                { type: "RICH_TEXT_NODE_TYPE_TOPIC", text: "#话题#", jump_url: "//t.bilibili.com" },
                { type: "RICH_TEXT_NODE_TYPE_AT", text: "@用户", rid: 2 },
                {
                  type: "RICH_TEXT_NODE_TYPE_EMOJI",
                  text: "[笑]",
                  emoji: { icon_url: "//i0.hdslb.com/emoji.png" },
                },
                { type: "RICH_TEXT_NODE_TYPE_LOTTERY", text: "互动抽奖" },
              ],
            },
            pics: [
              { url: "//i0.hdslb.com/long.jpg", width: 800, height: 4000 },
              { url: "//i0.hdslb.com/animated.gif", width: 600, height: 600 },
            ],
          },
        },
      }),
    );

    expect(item.text).toBe("图文正文");
    expect(item.richTextNodes).toHaveLength(4);
    expect(item.top).toBe(true);
    expect(item.commentType).toBe(11);
    expect(item.content).toMatchObject({
      kind: "images",
      images: [
        { src: "https://i0.hdslb.com/long.jpg", ratio: 0.2 },
        { src: "https://i0.hdslb.com/animated.gif", ratio: 1 },
      ],
    });
  });

  it("keeps the OPUS title that the summary text does not contain", () => {
    const item = mapDynamicItem(
      fixture({
        type: "DYNAMIC_TYPE_DRAW",
        desc: null,
        major: {
          type: "MAJOR_TYPE_OPUS",
          opus: {
            title: "继续建设牛牛快乐屋😋",
            summary: { text: "分享图片" },
            pics: [{ url: "//i0.hdslb.com/house.png", width: 1440, height: 1080 }],
          },
        },
      }),
    );

    expect(item.title).toBe("继续建设牛牛快乐屋😋");
    expect(item.text).toBe("分享图片");
    expect(item.content).toMatchObject({ kind: "images" });
  });

  it("skips the OPUS title when the summary already starts with it", () => {
    const item = mapDynamicItem(
      fixture({
        type: "DYNAMIC_TYPE_DRAW",
        desc: null,
        major: {
          type: "MAJOR_TYPE_OPUS",
          opus: {
            title: "继续建设牛牛快乐屋😋",
            summary: { text: "继续建设牛牛快乐屋😋 今天又添了新家具" },
            pics: [],
          },
        },
      }),
    );

    expect(item.title).toBe("");
    expect(item.text).toBe("继续建设牛牛快乐屋😋 今天又添了新家具");
  });

  it("keeps the OPUS title out of the card for articles and other major types", () => {
    const article = mapDynamicItem(
      fixture({
        type: "DYNAMIC_TYPE_ARTICLE",
        desc: null,
        major: {
          type: "MAJOR_TYPE_OPUS",
          opus: {
            title: "专栏标题",
            jump_url: "//www.bilibili.com/read/cv1",
            summary: { text: "专栏摘要" },
            pics: [],
          },
        },
      }),
    );
    const video = mapDynamicItem(
      fixture({
        type: "DYNAMIC_TYPE_AV",
        major: {
          type: "MAJOR_TYPE_ARCHIVE",
          archive: { aid: 1, bvid: "BV1title", title: "视频标题", stat: {} },
        },
      }),
    );

    expect(article.title).toBe("");
    expect(video.title).toBe("");
  });

  it("maps pure text and accepts numeric timestamps", () => {
    const item = mapDynamicItem(
      fixture({
        type: "DYNAMIC_TYPE_WORD",
        pubTs: 1725100001,
        desc: null,
        major: {
          type: "MAJOR_TYPE_OPUS",
          opus: {
            summary: {
              text: "OPUS 文字正文",
              rich_text_nodes: [
                { type: "RICH_TEXT_NODE_TYPE_WEB", text: "网页", jump_url: "//b23.tv/x" },
              ],
            },
            pics: [],
          },
        },
      }),
    );
    expect(item.time).toBe(1725100001);
    expect(item.text).toBe("OPUS 文字正文");
    expect(item.content.kind).toBe("text");
  });

  it("normalizes dash-only descriptions to empty text", () => {
    const item = mapDynamicItem(
      fixture({
        type: "DYNAMIC_TYPE_WORD",
        desc: { text: "-", rich_text_nodes: [] },
        major: {
          type: "MAJOR_TYPE_COMMON",
          common: { title: "链接卡", desc: "-" },
        },
      }),
    );

    expect(item.text).toBe("");
    expect(item.content).toMatchObject({ kind: "link", description: "" });
  });

  it("reuses the mapper for forwarded video and forwarded OPUS", () => {
    const forwardedVideo = fixture({
      id: "forward-video",
      type: "DYNAMIC_TYPE_FORWARD",
      orig: fixture({
        id: "original-video",
        type: "DYNAMIC_TYPE_AV",
        major: {
          type: "MAJOR_TYPE_ARCHIVE",
          archive: { aid: 1, bvid: "BV1forward", title: "原视频", stat: {} },
        },
      }),
    });
    const forwardedDraw = fixture({
      id: "forward-draw",
      type: "DYNAMIC_TYPE_FORWARD",
      orig: fixture({
        id: "original-draw",
        type: "DYNAMIC_TYPE_DRAW",
        desc: null,
        major: {
          type: "MAJOR_TYPE_OPUS",
          opus: {
            summary: { text: "原图文" },
            pics: [{ url: "//i0.hdslb.com/original.jpg", width: 100, height: 100 }],
          },
        },
      }),
    });

    expect(mapDynamicItem(forwardedVideo).original?.content.kind).toBe("video");
    expect(mapDynamicItem(forwardedVideo).commentType).toBe(17);
    expect(mapDynamicItem(forwardedDraw).original).toMatchObject({
      text: "原图文",
      content: { kind: "images" },
    });
  });

  it("accepts a string vote count inside a forwarded original", () => {
    const item = mapDynamicItem(
      fixture({
        id: "forward-vote",
        type: "DYNAMIC_TYPE_FORWARD",
        orig: fixture({
          id: "original-vote",
          additional: {
            type: "ADDITIONAL_TYPE_VOTE",
            vote: { desc: "原动态投票", join_num: "1742" },
          },
        }),
      }),
    );

    expect(item.original?.additional).toMatchObject({
      head: "投票",
      title: "原动态投票",
      description: "1742 人参与",
    });
  });

  it("accepts the placeholder original returned when the forwarded dynamic is gone", () => {
    // https://t.bilibili.com/1124985452502188053 的真实详情响应：
    // 被转发的原动态已失效，接口用 id_str: null 的占位对象代替（头像挂件字段已省略）
    const item = mapDynamicItem(
      DynamicDetailResponseSchema.parse({
        item: {
          id_str: "1124985452502188053",
          type: "DYNAMIC_TYPE_FORWARD",
          basic: {
            comment_id_str: "1124985452502188053",
            comment_type: 17,
            like_icon: { action_url: "", end_url: "", id: 0, start_url: "" },
            rid_str: "1124985452502188053",
          },
          modules: {
            module_author: {
              face: "https://i0.hdslb.com/bfs/face/b4e08d394ace1dda4fa731f105bf7efe5a3b6ec3.jpg",
              face_nft: false,
              following: null,
              jump_url: "//space.bilibili.com/485256303/dynamic",
              label: "",
              mid: 485256303,
              name: "茂的模",
              pub_action: "",
              pub_time: "2025年10月18日 14:38",
              pub_ts: 1760769487,
              type: "AUTHOR_TYPE_NORMAL",
            },
            module_dynamic: {
              additional: null,
              desc: {
                rich_text_nodes: [
                  {
                    orig_text: "“世界的结构不是偶然的。”",
                    text: "“世界的结构不是偶然的。”",
                    type: "RICH_TEXT_NODE_TYPE_TEXT",
                  },
                ],
                text: "“世界的结构不是偶然的。”",
              },
              major: null,
              topic: null,
            },
            module_stat: {
              comment: { count: 7, forbidden: false },
              forward: { count: 3, forbidden: false },
              like: { count: 453, forbidden: false, status: false },
            },
          },
          orig: {
            id_str: null,
            type: "DYNAMIC_TYPE_NONE",
            basic: {
              comment_id_str: "",
              comment_type: 0,
              like_icon: { action_url: "", end_url: "", id: 0, start_url: "" },
              rid_str: "",
            },
            modules: {
              module_author: {
                face: "",
                face_nft: false,
                following: false,
                jump_url: "",
                label: "",
                mid: 0,
                name: "",
                pub_action: "",
                pub_time: "",
                pub_ts: 0,
                type: "AUTHOR_TYPE_NORMAL",
              },
              module_dynamic: {
                additional: null,
                desc: null,
                major: { none: { tips: "源动态不可见" }, type: "MAJOR_TYPE_NONE" },
                topic: null,
              },
            },
            visible: true,
          },
          visible: true,
        },
      }).item,
    );

    expect(item.id).toBe("1124985452502188053");
    expect(item.text).toBe("“世界的结构不是偶然的。”");
    expect(item.author.name).toBe("茂的模");
    expect(item.content).toEqual({ kind: "text" });
    expect(item.original).toMatchObject({
      id: "",
      url: "",
      commentId: "",
      commentType: 0,
      author: { mid: 0, name: "" },
      content: { kind: "unavailable", message: "源动态不可见" },
    });
  });

  it("keeps parsing pages that contain a gone forwarded original", () => {
    const page = DynamicListResponseSchema.parse({
      has_more: false,
      items: [
        fixture({
          id: "1124985452502188053",
          type: "DYNAMIC_TYPE_FORWARD",
          orig: {
            id_str: null,
            type: "DYNAMIC_TYPE_NONE",
            basic: { comment_id_str: "", comment_type: 0 },
            modules: {
              module_author: { mid: 0, name: "", face: "", pub_action: "", pub_time: "", pub_ts: 0 },
              module_dynamic: {
                desc: null,
                topic: null,
                major: { type: "MAJOR_TYPE_NONE", none: { tips: "源动态不可见" } },
                additional: null,
              },
            },
          },
        }),
      ],
      offset: "",
    });

    expect(page.items).toHaveLength(1);
    expect(mapDynamicItem(page.items[0]).original?.id).toBe("");
  });

  it("maps article summaries, additional cards and unknown types safely", () => {
    const article = mapDynamicItem(
      fixture({
        type: "DYNAMIC_TYPE_ARTICLE",
        commentType: 12,
        desc: null,
        major: {
          type: "MAJOR_TYPE_OPUS",
          opus: {
            title: "专栏标题",
            jump_url: "//www.bilibili.com/read/cv1",
            summary: { text: "专栏摘要", has_more: true },
            pics: [{ url: "//i0.hdslb.com/article.jpg", width: 1200, height: 675 }],
          },
        },
        additional: {
          type: "ADDITIONAL_TYPE_GOODS",
          goods: {
            head_text: "商品",
            items: [{ name: "测试商品", price: "¥99", cover: "//i0.hdslb.com/goods.jpg" }],
          },
        },
      }),
    );
    const unknown = mapDynamicItem(
      fixture({ type: "DYNAMIC_TYPE_UNKNOWN", major: { type: "MAJOR_TYPE_BLOCKED" } }),
    );

    expect(article.content).toMatchObject({
      kind: "article",
      title: "专栏标题",
      description: "专栏摘要",
      hasMore: true,
    });
    expect(article.commentType).toBe(12);
    expect(article.additional).toMatchObject({ title: "测试商品", description: "¥99" });
    expect(unknown.content).toEqual({ kind: "unavailable", message: "暂不支持显示此类动态" });
  });

  it.each([
    [
      "ADDITIONAL_TYPE_RESERVE",
      { reserve: { title: "预约标题", desc1: { text: "预约时间" } } },
      "预约标题",
    ],
    ["ADDITIONAL_TYPE_COMMON", { common: { title: "游戏卡", desc1: "游戏简介" } }, "游戏卡"],
    ["ADDITIONAL_TYPE_VOTE", { vote: { desc: "投票标题", join_num: "20" } }, "投票标题"],
    ["ADDITIONAL_TYPE_UPOWER_LOTTERY", { upower_lottery: { title: "抽奖标题" } }, "抽奖标题"],
  ])("maps %s", (type, payload, title) => {
    const item = mapDynamicItem(fixture({ additional: { type, ...payload } }));
    expect(item.additional?.title).toBe(title);
  });

  it("accepts the object description returned by charging-exclusive lotteries", () => {
    const item = mapDynamicItem(
      fixture({
        additional: {
          type: "ADDITIONAL_TYPE_UPOWER_LOTTERY",
          upower_lottery: {
            title: "充电专属抽奖",
            desc: {
              text: "奖品描述",
              style: 1,
              jump_url: "//www.bilibili.com/h5/lottery/result?business_id=1",
            },
            hint: { text: "加入包月充电即可参与", style: 0 },
          },
        },
      }),
    );

    expect(item.additional).toEqual({
      head: "抽奖",
      title: "充电专属抽奖",
      description: "奖品描述",
      url: "https://www.bilibili.com/h5/lottery/result?business_id=1",
    });
  });
});

describe("dynamic paging schema", () => {
  it("accepts list/detail field differences and builds the verified query", () => {
    const page = DynamicListResponseSchema.parse({
      has_more: true,
      items: [
        fixture({ pubTs: "1725100000", following: 0 }),
        fixture({ id: "2", pubTs: 1725100001, following: 1 }),
        fixture({ id: "3", following: true }),
      ],
      offset: "next-offset",
      update_num: "2",
      future_server_field: true,
    });
    const url = buildDynamicListUrl(1567446009);
    const query = new URLSearchParams(url.split("?")[1]);

    expect(page.items).toHaveLength(3);
    expect(query.get("platform")).toBe("web");
    expect(query.get("timezone_offset")).toBe("-480");
    expect(query.get("features")).toContain("itemOpusStyle");
    expect(getDynamicPageKey(1567446009, 1, page)).toContain("offset=next-offset");
  });

  it("maps a real space feed payload whose OPUS title is separate from the text", () => {
    const item = mapDynamicItem(
      DynamicItemResponseSchema.parse({
        id_str: "1249774997124153364",
        type: "DYNAMIC_TYPE_DRAW",
        basic: {
          comment_id_str: "409710142",
          comment_type: 11,
          jump_url: "//www.bilibili.com/opus/1249774997124153364",
        },
        modules: {
          module_author: {
            face: "https://i2.hdslb.com/bfs/face/0f5c077c743dd4c1e0a8f3089becc6f4acbddc75.jpg",
            mid: "1625060795",
            name: "浪仔小牛",
            pub_action: "",
            pub_time: "18小时前",
            pub_ts: "1789824317",
          },
          module_dynamic: {
            desc: null,
            topic: null,
            major: {
              type: "MAJOR_TYPE_OPUS",
              opus: {
                jump_url: "//www.bilibili.com/opus/1249774997124153364",
                title: "继续建设牛牛快乐屋😋",
                summary: {
                  text: "分享图片",
                  rich_text_nodes: [{ type: "RICH_TEXT_NODE_TYPE_TEXT", text: "分享图片" }],
                  has_more: false,
                },
                pics: [
                  {
                    url: "http://i0.hdslb.com/bfs/new_dyn/live_40e4ae52cd899b75ed0211590688c2291625060795.png",
                    width: 1440,
                    height: 1080,
                  },
                ],
              },
            },
            additional: null,
          },
          module_tag: null,
          module_stat: {
            comment: { count: 36 },
            forward: { count: 0 },
            like: { count: 457 },
          },
        },
      }),
    );

    expect(item.title).toBe("继续建设牛牛快乐屋😋");
    expect(item.text).toBe("分享图片");
    expect(item.content).toMatchObject({
      kind: "images",
      images: [
        {
          src: "https://i0.hdslb.com/bfs/new_dyn/live_40e4ae52cd899b75ed0211590688c2291625060795.png",
          ratio: 1440 / 1080,
        },
      ],
    });
  });

  it("stops paging on no-more and empty pages", () => {
    const end = DynamicListResponseSchema.parse({ has_more: false, items: [], offset: "" });
    const empty = DynamicListResponseSchema.parse({ has_more: true, items: [], offset: "x" });
    expect(getDynamicPageKey(1, 1, end)).toBeNull();
    expect(getDynamicPageKey(1, 1, empty)).toBeNull();
    expect(getDynamicPageKey(undefined, 0)).toBeNull();
  });
});
