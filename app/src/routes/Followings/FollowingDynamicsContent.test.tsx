import type { ReactElement } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { DynamicItem } from "@/api/dynamic-items.type";
import type { DynamicListProps } from "@/components/dynamic/dynamic-list.types";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  dynamics: {
    list: [],
    error: undefined,
    isLoading: false,
    isLoadingMore: false,
    isRefreshing: false,
    isReachingEnd: true,
    isValidating: false,
    loadMore: vi.fn(),
    refresh: vi.fn(),
    retry: vi.fn(),
  },
}));

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mocks.navigate }),
}));
vi.mock("@/api/useFollowingDynamicItems", () => ({
  useFollowingDynamicItems: () => mocks.dynamics,
}));
vi.mock("@/components/dynamic/dynamic-list", () => ({ DynamicList: "DynamicList" }));

import FollowingDynamicsContent from "./FollowingDynamicsContent";

const item = {
  id: "dynamic-1",
  sourceType: "DYNAMIC_TYPE_WORD",
  author: { mid: "42", name: "关注的UP", face: "face.jpg" },
  date: "刚刚",
  time: 0,
  pubAction: "发布了动态",
  top: false,
  text: "这是关注动态",
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

describe("following dynamics content", () => {
  beforeEach(() => vi.clearAllMocks());

  test("uses the shared paged list and opens the selected author's dynamic detail", () => {
    const screen = FollowingDynamicsContent() as ReactElement<DynamicListProps>;
    expect(screen.type).toBe("DynamicList");
    expect(screen.props.loadingText).toBe("正在加载关注动态");
    expect(screen.props.isReachingEnd).toBe(true);

    screen.props.onItemPress(item);
    expect(mocks.navigate).toHaveBeenCalledWith("DynamicDetail", {
      dynamicId: "dynamic-1",
      title: "这是关注动态",
      user: { mid: "42", name: "关注的UP" },
    });

    screen.props.onTabReselect?.();
    expect(mocks.dynamics.refresh).toHaveBeenCalledOnce();
  });
});
