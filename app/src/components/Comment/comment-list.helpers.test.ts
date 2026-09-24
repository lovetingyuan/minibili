import { expect, test } from "vitest";

import { getCommentListEmptyText } from "./comment-list.helpers";

test("shows the empty state when the known comment count is zero even if loading failed", () => {
  expect(getCommentListEmptyText(0, new Error("network"))).toBe("还没有评论");
});

test("keeps the failure state when the comment count is not known to be zero", () => {
  expect(getCommentListEmptyText(undefined, new Error("network"))).toBe("评论已关闭或加载失败");
  expect(getCommentListEmptyText(3, new Error("network"))).toBe("评论已关闭或加载失败");
});
