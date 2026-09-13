import { assert, describe, expect, test } from "vitest";

import type { CommentResItem, CommentResponse } from "./comments.schema";
import { CommentResponseSchema } from "./comments.schema";
import {
  getComments,
  getCommentsPageUrl,
  getReplyItem,
  mergeCommentPages,
  patchCommentTree,
  transitionCommentAttitude,
} from "./comments";
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
