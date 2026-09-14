import type { ComponentProps, ReactElement } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { DynamicItem } from "@/api/dynamic-items.type";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  Pressable: "Pressable",
  View: "View",
}));
vi.mock("@/api/dynamic-items", () => ({
  useDynamicItems: () => ({
    error: undefined,
    isLoading: false,
    isLoadingMore: false,
    isReachingEnd: true,
    isRefreshing: false,
    isValidating: false,
    list: [],
    loadMore: vi.fn(),
    refresh: mocks.refresh,
    retry: vi.fn(),
  }),
}));
vi.mock("@/components/dynamic/dynamic-list", () => ({ DynamicList: "DynamicList" }));
vi.mock(
  "@/components/dynamic/dynamic-target",
  async () => await vi.importActual("../../components/dynamic/dynamic-target"),
);
vi.mock("@/components/styled/rneui", () => ({
  Button: "Button",
  FlashList: "FlashList",
  Skeleton: "Skeleton",
  Text: "Text",
}));
vi.mock("@/constants/colors.tw", () => import("../../constants/colors.tw"));
vi.mock("@/hooks/useUpdateNavigationOptions", () => ({ default: vi.fn() }));
vi.mock("./Header", () => ({ headerRight: vi.fn(), headerTitle: vi.fn() }));

import Dynamic from "./index";

type ListProps = {
  onItemPress: (item: DynamicItem) => void;
};

const baseItem = {
  id: "dynamic-1",
  sourceType: "DYNAMIC_TYPE_WORD",
  author: { mid: 123, name: "UP", face: "" },
  date: "2026-09-01",
  time: 0,
  pubAction: "发布了动态",
  top: false,
  text: "这是一条测试动态",
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

function renderList() {
  const screen = Dynamic({
    route: {
      key: "Dynamic-test",
      name: "Dynamic",
      params: { user: { mid: 123, name: "UP", face: "", sign: "" } },
    },
    navigation: { navigate: mocks.navigate },
  } as unknown as ComponentProps<typeof Dynamic>);
  return screen as ReactElement<ListProps>;
}

function pressRenderedCard(item: DynamicItem) {
  renderList().props.onItemPress(item);
}

describe("Dynamic list navigation", () => {
  beforeEach(() => vi.clearAllMocks());

  test("ordinary cards open their dynamic detail", () => {
    pressRenderedCard(baseItem);

    expect(mocks.navigate).toHaveBeenCalledWith("DynamicDetail", {
      dynamicId: "dynamic-1",
      title: "这是一条测试动态",
      user: { mid: 123, name: "UP", face: "", sign: "" },
    });
  });

  test("video cards skip the dynamic detail page and open the player directly", () => {
    pressRenderedCard({
      ...baseItem,
      content: {
        kind: "video",
        aid: 2,
        bvid: "BV1TEST",
        cover: "cover.jpg",
        title: "视频标题",
        description: "视频简介",
        duration: "01:30",
        play: 100,
        danmaku: 20,
      },
    });

    expect(mocks.navigate).toHaveBeenCalledWith(
      "Play",
      expect.objectContaining({
        aid: 2,
        bvid: "BV1TEST",
        title: "视频标题",
        mid: 123,
        name: "UP",
      }),
    );
    expect(mocks.navigate).not.toHaveBeenCalledWith("DynamicDetail", expect.anything());
  });
});
