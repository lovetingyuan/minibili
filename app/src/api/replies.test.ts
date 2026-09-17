import { expect, test } from "vitest";

import request from "./fetcher";
import type { ReplyItemType } from "./comments.types";
import {
  isReplyPageEnd,
  mergeReplyItems,
  removeReplyFromPages,
  shouldShowReplySection,
} from "./replies.helpers";
import type { RepliesPage } from "./replies.types";
import { ReplyResponseSchema } from "./replies.schema";

function createReply(id: string, rcount = 0): ReplyItemType {
  return {
    message: [],
    images: [],
    name: `user-${id}`,
    mid: id,
    face: "",
    sign: "",
    id,
    oid: "1000",
    root: id === "10" ? "0" : "10",
    root_str: id === "10" ? "0" : "10",
    rcount,
    attitude: "none",
    creatorLiked: false,
    top: false,
    like: 0,
    sex: "保密",
    type: 1,
    replies: [],
  };
}

test("merges preview and fetched replies without duplicates", () => {
  const preview = [
    { id: "1", source: "preview" },
    { id: "2", source: "preview" },
  ];
  const fetched = [
    { id: "1", source: "fetched" },
    { id: "3", source: "fetched" },
  ];

  expect(mergeReplyItems(preview, fetched)).toEqual([
    { id: "1", source: "fetched" },
    { id: "3", source: "fetched" },
    { id: "2", source: "preview" },
  ]);
});

test("keeps a locally added reply first while preserving fetched server order", () => {
  const preview = [{ id: "1" }, { id: "2" }];
  const fetched = [{ id: "2" }, { id: "3" }];
  const added = [{ id: "4" }];
  expect(mergeReplyItems(preview, fetched, added).map((item) => item.id)).toEqual([
    "4",
    "2",
    "3",
    "1",
  ]);
});

test("treats a short anonymous page as the end", () => {
  expect(isReplyPageEnd(20, 18, 3, 3)).toBe(true);
  expect(isReplyPageEnd(20, 40, 20, 20)).toBe(false);
  expect(isReplyPageEnd(20, 20, 20, 20)).toBe(true);
});

test("shows the reply entry without embedded previews", () => {
  expect(shouldShowReplySection(3, 0)).toBe(true);
  expect(shouldShowReplySection(0, 1)).toBe(true);
  expect(shouldShowReplySection(0, 0)).toBe(false);
});

test("removes a reply and decrements the thread counts on every cached page", () => {
  const pages: RepliesPage[] = [
    {
      page: { num: 1, size: 20, count: 2 },
      root: createReply("10", 2),
      replies: [createReply("11")],
    },
    {
      page: { num: 2, size: 20, count: 2 },
      root: createReply("10", 2),
      replies: [createReply("12")],
    },
  ];

  const next = removeReplyFromPages(pages, "12");

  expect(next?.map((page) => page.page.count)).toEqual([1, 1]);
  expect(next?.map((page) => page.root?.rcount)).toEqual([1, 1]);
  expect(next?.flatMap((page) => page.replies).map((reply) => reply.id)).toEqual(["11"]);
});

test.skip("get-comment-replies-1", async () => {
  const repliesInfo = {
    oid: 1451532147,
    root: 212143555808,
    type: 1,
  };
  const res = await request(
    `/x/v2/reply/reply?oid=${repliesInfo.oid}&type=${repliesInfo.type}&root=${repliesInfo.root}&pn=${1}&ps=20`,
  );
  ReplyResponseSchema.parse(res);
});

test("get-comment-replies-2", async () => {
  const repliesInfo = {
    oid: 1201343439,
    root: 211238435904,
    type: 1,
  };
  const res = await request(
    `/x/v2/reply/reply?oid=${repliesInfo.oid}&type=${repliesInfo.type}&root=${repliesInfo.root}&pn=${2}&ps=20`,
  );
  ReplyResponseSchema.parse(res);
});
