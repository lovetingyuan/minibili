import { assert, describe, expect, test } from "vitest";

import type { CommentResItem, CommentResponse } from "./comments.schema";
import { CommentResponseSchema } from "./comments.schema";
import {
  getComments,
  getCommentsPageUrl,
  getReplyItem,
  mergeCommentPages,
  patchCommentTree,
  prependCommentToPages,
  removeCommentFromPages,
  transitionCommentAttitude,
} from "./comments";
import type { CommentsPage } from "./comments.types";
import fetcher from "./fetcher";

function createComment(id: string): CommentResItem {
  return {
    action: 0,
    content: { message: `comment-${id}` },
    count: 0,
    ctime: 0,
    invisible: false,
    like: 0,
    member: {
      avatar: "https://example.com/avatar.jpg",
      is_senior_member: 0,
      level_info: {
        current_level: 1,
        current_min: 0,
        current_exp: 0,
        next_exp: 1,
      },
      mid: id,
      rank: "10000",
      sex: "保密",
      sign: "",
      uname: `user-${id}`,
    },
    mid: Number(id),
    oid: "117142179616374",
    parent: 0,
    parent_str: "0",
    rcount: 0,
    reply_control: {},
    root: 0,
    root_str: "0",
    rpid: Number(id),
    rpid_str: id,
    state: 0,
    type: 1,
    up_action: { like: false, reply: false },
    replies: null,
  };
}

function createCommentResponse(replies: CommentResItem[] | null): CommentResponse {
  return {
    assist: 0,
    blacklist: 0,
    note: 0,
    cursor: {
      is_begin: true,
      prev: 0,
      next: 0,
      is_end: true,
      all_count: replies?.length || 0,
      mode: 3,
      name: "热门评论",
      pagination_reply: null,
    },
    replies,
    top: null,
    top_replies: null,
    upper: { mid: 1 },
  };
}

/**
 * 抓包得到的原始响应格式：比 schema 多出不少字段，图片也可能缺尺寸。
 * 用来确保解析时不会因为可选字段缺失而让整个评论区加载失败。
 */
type RawCommentContent = {
  message?: string;
  emote?: Record<string, { url: string; text?: string; id?: number }>;
  jump_url?: Record<string, { title?: string; state?: number }>;
  vote?: { id: number; cnt?: number; deleted?: boolean; title?: string; url?: string };
  pictures?: {
    img_src: string;
    img_width?: number;
    img_height?: number;
    img_size?: number;
    item_id?: string;
  }[];
  picture_scale?: number;
};

function createRawComment(id: string, content: RawCommentContent = {}) {
  return {
    rpid: Number(id),
    oid: 117300422251725,
    type: 1,
    mid: 263294389,
    root: 0,
    parent: 0,
    dialog: 0,
    count: 0,
    rcount: 0,
    state: 0,
    fansgrade: 0,
    attr: 134217728,
    ctime: 1789918389,
    mid_str: "263294389",
    oid_str: "117300422251725",
    rpid_str: id,
    root_str: "0",
    parent_str: "0",
    dialog_str: "0",
    like: 382,
    action: 0,
    member: {
      mid: "263294389",
      uname: "laysia期许",
      handle: "",
      sex: "保密",
      sign: "",
      avatar: "https://example.com/avatar.jpg",
      rank: "10000",
      face_nft_new: 0,
      is_senior_member: 0,
      senior: {},
      level_info: { current_level: 6, current_min: 0, current_exp: 0, next_exp: 0 },
    },
    content: { message: `comment-${id}`, ...content },
    replies: null,
    assist: 0,
    up_action: { like: false, reply: false },
    invisible: false,
    reply_control: {
      max_line: 6,
      sub_reply_entry_text: "共48条回复",
      sub_reply_title_text: "相关回复共48条",
      time_desc: "2天前发布",
      location: "IP属地：青海",
    },
  };
}

function createRawResponse(overrides: {
  replies?: unknown[];
  top?: unknown;
  topReplies?: unknown[] | null;
}) {
  return {
    assist: 0,
    blacklist: 0,
    note: 1,
    cursor: {
      is_begin: true,
      prev: 0,
      next: 0,
      is_end: false,
      mode: 3,
      mode_text: "",
      all_count: 3686,
      support_mode: [2, 3],
      name: "热门评论",
      pagination_reply: { next_offset: "CAESEDE4MzMxMjk0NDcyNzU1NDUaCAoGwYL22pQJIgIIAQ==" },
      session_id: "1833129447275545",
    },
    replies: overrides.replies ?? [],
    top: overrides.top ?? null,
    top_replies: overrides.topReplies ?? null,
    effects: { preloading: "" },
    config: { showtopic: 1, show_up_flag: true, read_only: false },
    upper: { mid: 347441270 },
  };
}

describe("reply-list", () => {
  test("keeps all three comments from a limited anonymous response", () => {
    const response = createCommentResponse([
      createComment("1"),
      createComment("2"),
      createComment("3"),
    ]);

    expect(getComments(response, 1).map((comment) => comment.id)).toEqual(["1", "2", "3"]);
    expect(getComments(createCommentResponse(null), 1)).toEqual([]);
  });

  test("builds offset pagination urls and stops at the end", () => {
    const firstUrl = getCommentsPageUrl("117142179616374", 1, 3);
    expect(firstUrl).not.toBeNull();
    const firstParams = new URL(firstUrl!, "https://api.bilibili.com").searchParams;
    expect(firstParams.get("pagination_str")).toBe('{"offset":""}');
    expect(firstParams.get("plat")).toBe("1");

    const nextUrl = getCommentsPageUrl("117142179616374", 1, 2, {
      is_end: false,
      pagination_reply: { next_offset: "CAEaADIDCKAB" },
    });
    expect(nextUrl).not.toBeNull();
    const nextParams = new URL(nextUrl!, "https://api.bilibili.com").searchParams;
    expect(nextParams.get("pagination_str")).toBe('{"offset":"CAEaADIDCKAB"}');

    expect(
      getCommentsPageUrl("117142179616374", 1, 3, {
        is_end: false,
        pagination_reply: null,
      }),
    ).toBeNull();
    expect(
      getCommentsPageUrl("117142179616374", 1, 3, {
        is_end: true,
        pagination_reply: { next_offset: "unused" },
      }),
    ).toBeNull();
  });

  test("deduplicates pages in server order without replacing comment references", () => {
    const first = getComments(createCommentResponse([createComment("1"), createComment("2")]), 1);
    const second = getComments(createCommentResponse([createComment("2"), createComment("3")]), 1);
    const merged = mergeCommentPages([{ replies: first }, { replies: second }]);
    expect(merged.map((comment) => comment.id)).toEqual(["1", "2", "3"]);
    expect(merged[0]).toBe(first[0]);
    expect(merged[1]).toBe(first[1]);
    expect(merged[2]).toBe(second[1]);
  });

  test("parses rich content deterministically and keeps viewer attitude separate from creator like", () => {
    const item = createComment("8");
    item.action = 2;
    item.up_action.like = true;
    item.content = {
      message: "你好[doge] @alice BV1abc {vote:7} https://example.com",
      emote: { "[doge]": { id: 1, text: "[doge]", url: "https://example.com/doge.png" } },
      at_name_to_mid: { alice: 9 },
      jump_url: { BV1abc: { title: "一个视频" } },
      vote: {
        id: 7,
        title: "一个投票",
        cnt: 1,
        desc: "",
        deleted: false,
        url: "https://www.bilibili.com/vote/7",
      },
    };
    const first = getReplyItem(item);
    const second = getReplyItem(item);
    expect(first.message).toEqual(second.message);
    expect(first.message.map((node) => node.type)).toEqual([
      "text",
      "emoji",
      "text",
      "at",
      "text",
      "av",
      "text",
      "vote",
      "text",
      "url",
    ]);
    expect(first.attitude).toBe("dislike");
    expect(first.creatorLiked).toBe(true);
  });

  test("keeps the whole list when the top comment has sized-less goods pictures", () => {
    const goodsComment = createRawComment("318018213968", {
      message: "https://b23.tv/mall-goods-collection ",
      picture_scale: 1,
      jump_url: {
        "https://b23.tv/mall-goods-collection": { title: "好物清单 | 2件UP主推荐好物", state: 0 },
      },
      pictures: [
        {
          img_src: "https://i0.hdslb.com/bfs/mall/mall/1d/d0/a05aede9dd26aa50a2e094b76dbe6f9c.png",
          img_width: 800,
          img_height: 800,
          item_id: "42142288",
        },
        {
          img_src: "https://i0.hdslb.com/bfs/mall/mall/3f/06/07d77da1e000e9998a09dd9835ec294b.png",
          item_id: "42142267",
        },
      ],
    });
    const response = CommentResponseSchema.parse(
      createRawResponse({
        replies: [createRawComment("1"), createRawComment("2")],
        top: { admin: null, upper: goodsComment },
        topReplies: [goodsComment],
      }),
    );

    const comments = getComments(response, 1);
    expect(comments.map((comment) => comment.id)).toEqual(["318018213968", "1", "2"]);
    expect(comments[0].top).toBe(true);
    expect(comments[0].time).toBe("2天前发布");
    expect(comments[0].moreText).toBe("共48条回复");
    expect(comments[0].images).toEqual([
      {
        src: "https://i0.hdslb.com/bfs/mall/mall/1d/d0/a05aede9dd26aa50a2e094b76dbe6f9c.png",
        width: 800,
        height: 800,
        ratio: 1,
      },
      {
        src: "https://i0.hdslb.com/bfs/mall/mall/3f/06/07d77da1e000e9998a09dd9835ec294b.png",
        width: 0,
        height: 0,
        ratio: 1,
      },
    ]);
  });

  test("falls back for rich-content fields the server omits", () => {
    const response = CommentResponseSchema.parse(
      createRawResponse({
        replies: [
          createRawComment("8", {
            message: "看这个[doge] BV1abc {vote:7}",
            emote: { "[doge]": { url: "https://example.com/doge.png" } },
            jump_url: { BV1abc: { state: 0 } },
            vote: { id: 7, cnt: 1, deleted: false },
          }),
        ],
      }),
    );

    const [comment] = getComments(response, 1);
    expect(comment.message.map((node) => node.type)).toEqual([
      "text",
      "emoji",
      "text",
      "av",
      "text",
      "vote",
    ]);
    expect(comment.message[1]).toEqual({ type: "emoji", url: "https://example.com/doge.png" });
    expect(comment.message[3]).toEqual({ type: "av", text: "BV1abc", url: "https://b23.tv/BV1abc" });
    expect(comment.message[5]).toEqual({ type: "vote", text: undefined, url: undefined });
  });

  test.each([
    ["none", 10, "like", 11],
    ["like", 10, "none", 9],
    ["like", 10, "dislike", 9],
    ["dislike", 10, "like", 11],
    ["dislike", 0, "none", 0],
  ] as const)("transitions attitude %s/%s to %s/%s", (current, like, next, expected) => {
    const item = { ...getReplyItem(createComment("9")), attitude: current, like };
    expect(transitionCommentAttitude(item, next)).toMatchObject({ attitude: next, like: expected });
  });

  test("patches a preview reply without replacing unaffected root data", () => {
    const rootSource = createComment("20");
    rootSource.replies = [createComment("21"), createComment("22")];
    const root = getComments(createCommentResponse([rootSource]), 1)[0];
    const next = patchCommentTree(root, "21", (reply) => transitionCommentAttitude(reply, "like"));
    expect(next).not.toBe(root);
    expect(next.replies[0]).toMatchObject({ id: "21", attitude: "like", like: 1 });
    expect(next.replies[1]).toBe(root.replies[1]);
  });

  test("prepends a new comment to the first page and bumps the total count", () => {
    const cursor = createCommentResponse(null).cursor;
    const pages: CommentsPage[] = [
      {
        cursor: { ...cursor, all_count: 1 },
        replies: getComments(createCommentResponse([createComment("1")]), 1),
        ownerMid: "1",
      },
      {
        cursor: { ...cursor, all_count: 1 },
        replies: getComments(createCommentResponse([createComment("2")]), 1),
        ownerMid: "1",
      },
    ];
    const added = getReplyItem(createComment("9"));
    const next = prependCommentToPages(pages, added);
    expect(next?.[0].replies.map((comment) => comment.id)).toEqual(["9", "1"]);
    expect(next?.[0].replies[0]).toBe(added);
    expect(next?.[0].cursor.all_count).toBe(2);
    expect(next?.[1]).toBe(pages[1]);
    expect(pages[0].replies.map((comment) => comment.id)).toEqual(["1"]);
    expect(pages[0].cursor.all_count).toBe(1);
    expect(prependCommentToPages(undefined, added)).toBeUndefined();
    expect(prependCommentToPages([], added)).toEqual([]);
  });

  test("removes a deleted comment and keeps the counters consistent", () => {
    const cursor = createCommentResponse(null).cursor;
    const rootSource = createComment("20");
    rootSource.rcount = 1;
    rootSource.replies = [createComment("21")];
    const page: CommentsPage = {
      cursor: { ...cursor, all_count: 2 },
      replies: getComments(createCommentResponse([createComment("1"), rootSource]), 1),
      ownerMid: "1",
    };
    const pages = [page];

    const afterRoot = removeCommentFromPages(pages, { id: "1", root: "0" });
    expect(afterRoot?.[0].replies.map((comment) => comment.id)).toEqual(["20"]);
    expect(afterRoot?.[0].cursor.all_count).toBe(1);

    const afterReply = removeCommentFromPages(pages, { id: "21", root: "20" });
    expect(afterReply?.[0].replies[1].replies).toEqual([]);
    expect(afterReply?.[0].replies[1].rcount).toBe(0);
    expect(afterReply?.[0].replies[1]).not.toBe(page.replies[1]);
    expect(afterReply?.[0].replies[0]).toBe(page.replies[0]);
    expect(afterReply?.[0].cursor.all_count).toBe(2);

    expect(removeCommentFromPages(pages, { id: "999", root: "0" })?.[0]).toBe(page);
    expect(removeCommentFromPages(undefined, { id: "1", root: "0" })).toBeUndefined();
  });

  test("updates first-page totals for later roots and counts non-previewed deleted replies", () => {
    const cursor = createCommentResponse(null).cursor;
    const rootSource = createComment("20");
    rootSource.rcount = 3;
    const root = getComments(createCommentResponse([rootSource]), 1)[0];
    const pages: CommentsPage[] = [
      {
        cursor: { ...cursor, all_count: 2 },
        replies: getComments(createCommentResponse([createComment("1")]), 1),
        ownerMid: "1",
      },
      {
        cursor: { ...cursor, all_count: 2 },
        replies: [root],
        ownerMid: "1",
      },
    ];

    const afterReply = removeCommentFromPages(pages, { id: "99", root: "20" });
    expect(afterReply?.[1].replies[0].rcount).toBe(2);
    expect(afterReply?.[0].cursor.all_count).toBe(2);

    const afterRoot = removeCommentFromPages(pages, { id: "20", root: "0" });
    expect(afterRoot?.[0].cursor.all_count).toBe(1);
    expect(afterRoot?.[1].replies).toEqual([]);
  });

  test("video-comment", async () => {
    const url = getCommentsPageUrl("117142179616374", 1, 3);
    assert.ok(url);
    const res = await fetcher<CommentResponse>(url);

    CommentResponseSchema.parse(res);
    assert.ok((res.replies?.length || 0) > 0);
  });
  test("text-comment", async () => {
    const res = await fetcher("/x/v2/reply/wbi/main?oid=228138377&type=11");
    CommentResponseSchema.parse(res);
  });
});
