import { expect, test } from "vitest";

import type { ReplyItemType } from "@/api/comments.types";
import type { RepliesInfo } from "@/store/replies-info.type";

import { removeReplyFromInfo } from "./reply-list.helpers";

function createReply(id: string, root: string | number, rcount = 0): ReplyItemType {
  return {
    message: [],
    images: [],
    name: `user-${id}`,
    mid: id,
    face: "",
    sign: "",
    id,
    oid: "1000",
    root,
    root_str: String(root),
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

test("removes a reply from previews and local additions while retargeting the composer", () => {
  const deleted = createReply("12", "10");
  const kept = createReply("11", "10");
  const rootComment = { ...createReply("10", "0", 2), replies: [kept, deleted] };
  const info: RepliesInfo = {
    oid: "1000",
    root: "10",
    type: 1,
    allCount: 2,
    rootComment,
    previewReplies: [kept, deleted],
    addedReplies: [deleted],
    ownerMid: "1",
    sourceUrl: "https://www.bilibili.com/video/BV1TEST",
    replyTarget: deleted,
    focusComposer: true,
  };

  const next = removeReplyFromInfo(info, deleted.id);

  expect(next.allCount).toBe(1);
  expect(next.rootComment.rcount).toBe(1);
  expect(next.rootComment.replies).toEqual([kept]);
  expect(next.previewReplies).toEqual([kept]);
  expect(next.addedReplies).toEqual([]);
  expect(next.replyTarget.id).toBe(rootComment.id);
});
