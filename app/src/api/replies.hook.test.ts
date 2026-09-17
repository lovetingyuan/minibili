import { beforeEach, expect, test, vi } from "vitest";

import type { ReplyItemType } from "./comments.types";
import type { RepliesPage } from "./replies.types";

const mocks = vi.hoisted(() => ({
  state: {
    data: undefined as RepliesPage[] | undefined,
    error: undefined as Error | undefined,
    size: 1,
    setSize: vi.fn(),
    mutate: vi.fn(),
    isValidating: false,
    isLoading: false,
  },
}));

vi.mock("swr/infinite", () => ({ default: () => mocks.state }));
vi.mock("@/store", () => ({
  useStore: () => ({
    repliesInfo: {
      oid: "1000",
      type: 1,
      root: "10",
      allCount: 2,
      previewReplies: [],
      addedReplies: [],
      rootComment: null,
    },
  }),
}));
vi.mock("./fetcher", () => ({ default: vi.fn() }));

import { useReplies } from "./replies";

function createReply(id: string): ReplyItemType {
  return {
    message: [],
    images: [],
    name: `user-${id}`,
    mid: id,
    face: "",
    sign: "",
    id,
    oid: "1000",
    root: "10",
    root_str: "10",
    rcount: 0,
    attitude: "none",
    creatorLiked: false,
    top: false,
    like: 0,
    sex: "保密",
    type: 1,
    replies: [],
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

test("keeps a failed reply page retryable without marking it as the end", async () => {
  mocks.state.data = [
    {
      page: { num: 1, size: 1, count: 2 },
      replies: [createReply("11")],
      root: null,
    },
  ];
  mocks.state.error = new Error("network");
  mocks.state.size = 2;

  const replies = useReplies();
  replies.update();
  expect(mocks.state.setSize).not.toHaveBeenCalled();

  await replies.retry();
  expect(replies.isPageEnd).toBe(false);
  expect(mocks.state.setSize).toHaveBeenCalledWith(2);
  expect(replies).not.toHaveProperty("isLimited");
  expect(replies).not.toHaveProperty("isReachingEnd");
});
