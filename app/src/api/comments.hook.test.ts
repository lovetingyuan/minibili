import { beforeEach, expect, test, vi } from "vitest";

import type { CommentsPage } from "./comments.types";

const mocks = vi.hoisted(() => ({
  state: {
    data: undefined as CommentsPage[] | undefined,
    error: undefined as Error | undefined,
    size: 1,
    setSize: vi.fn(),
    mutate: vi.fn(),
    isValidating: false,
    isLoading: false,
  },
}));

vi.mock("swr/infinite", () => ({ default: () => mocks.state }));
vi.mock("./fetcher", () => ({ default: vi.fn() }));

import { useComments } from "./comments";

function createPage(isEnd: boolean, nextOffset?: string): CommentsPage {
  return {
    cursor: {
      is_begin: true,
      prev: 0,
      next: 0,
      is_end: isEnd,
      all_count: 31,
      mode: 3,
      name: "热门评论",
      pagination_reply: nextOffset ? { next_offset: nextOffset } : null,
    },
    replies: [],
    ownerMid: "1",
  };
}

beforeEach(() => {
  mocks.state.data = undefined;
  mocks.state.error = undefined;
  mocks.state.size = 1;
  mocks.state.setSize.mockReset().mockResolvedValue(undefined);
  mocks.state.mutate.mockReset().mockResolvedValue(undefined);
  mocks.state.isValidating = false;
  mocks.state.isLoading = false;
});

test("treats only the server cursor as the end of the root-comment list", () => {
  mocks.state.data = [createPage(true)];

  const comments = useComments("1000", 1);

  expect(comments.data.allCount).toBe(31);
  expect(comments.data.replies).toHaveLength(0);
  expect(comments.isPageEnd).toBe(true);
  expect(comments).not.toHaveProperty("isLimited");
  expect(comments).not.toHaveProperty("isReachingEnd");
});

test("keeps a failed next page retryable without advancing the requested size", async () => {
  mocks.state.data = [createPage(false, "next")];
  mocks.state.error = new Error("network");
  mocks.state.size = 2;

  const comments = useComments("1000", 1);
  comments.update();
  expect(mocks.state.setSize).not.toHaveBeenCalled();

  await comments.retry();
  expect(comments.isPageEnd).toBe(false);
  expect(mocks.state.setSize).toHaveBeenCalledWith(2);
});
