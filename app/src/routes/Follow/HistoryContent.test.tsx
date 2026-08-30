import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import type { useBilibiliHistory } from "../../api/useBilibiliHistory";

const mocks = vi.hoisted(() => ({
  history: {} as ReturnType<typeof useBilibiliHistory>,
}));
vi.mock("@/api/useBilibiliHistory", () => ({ useBilibiliHistory: () => mocks.history }));
vi.mock("react-native", () => ({ ActivityIndicator: "ActivityIndicator", View: "View" }));
vi.mock("@/components/styled/rneui", () => ({
  Button: "Button",
  FlashList: "FlashList",
  Icon: "Icon",
  Text: "Text",
}));
vi.mock("@/components/VideoItem", () => ({ default: "VideoListItem" }));
vi.mock("@/constants/colors.tw", () => import("../../constants/colors.tw"));
vi.mock("@/utils/watch-time", () => import("../../utils/watch-time"));

import HistoryContent from "./HistoryContent";

function elements(
  node: ReactNode,
): ReactElement<{ children?: ReactNode; title?: string; onPress?: () => void }>[] {
  const result: ReactElement<{ children?: ReactNode; title?: string; onPress?: () => void }>[] = [];
  React.Children.forEach(node, (child) => {
    if (React.isValidElement<{ children?: ReactNode }>(child)) {
      result.push(child, ...elements(child.props.children));
    }
  });
  return result;
}
function text(node: ReactNode): string {
  return React.Children.toArray(node)
    .map((child) => {
      if (React.isValidElement<{ children?: ReactNode }>(child)) return text(child.props.children);
      return typeof child === "string" ? child : "";
    })
    .join("");
}
beforeEach(() => {
  mocks.history = {
    items: [],
    hasMore: false,
    isLoading: false,
    isValidating: false,
    isLoadingMore: false,
    error: undefined,
    refreshing: false,
    loadMore: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
    retry: vi.fn().mockResolvedValue(undefined),
  };
});

test("empty filtered pages offer further loading and a true end shows the empty message", () => {
  expect(text(HistoryContent().props.ListEmptyComponent)).toContain("暂无 B站视频观看历史");
  mocks.history.hasMore = true;
  const empty = HistoryContent().props.ListEmptyComponent;
  expect(text(empty)).toContain("当前已加载记录中暂无视频");
  elements(empty)
    .find((element) => element.props.title === "继续加载")
    ?.props.onPress?.();
  expect(mocks.history.loadMore).toHaveBeenCalledOnce();
});

test("list interactions call refresh and loadMore and first-page errors expose retry", () => {
  const list = HistoryContent().props;
  list.onRefresh();
  list.onEndReached();
  expect(mocks.history.refresh).toHaveBeenCalledOnce();
  expect(mocks.history.loadMore).toHaveBeenCalledOnce();
  mocks.history.error = new Error("offline");
  const empty = HistoryContent().props.ListEmptyComponent;
  expect(text(empty)).toContain("观看历史加载失败");
  elements(empty)
    .find((element) => element.props.title === "重试")
    ?.props.onPress?.();
  expect(mocks.history.retry).toHaveBeenCalledOnce();
});

test("renders playable history through the shared card and keeps unavailable records inert", () => {
  const watchedAt = new Date(2026, 7, 30, 13, 5).getTime() / 1000;
  const video = { bvid: "BV1", title: "title", name: "UP", mid: 1, cover: "", duration: 90 };
  const item = { key: "1", title: "title", watchedAt, video };
  const list = HistoryContent().props;
  const playable = list.renderItem({ item });
  expect(playable.type).toBe("VideoListItem");
  expect(playable.props).toMatchObject({ video, watchedAt });
  const unavailable = list.renderItem({ item: { ...item, video: null } });
  expect(text(unavailable)).toContain("暂不支持播放或已失效");
  expect(text(unavailable)).toContain("观看于 2026-08-30 13:05");
  expect(elements(unavailable).some((element) => element.props.onPress)).toBe(false);
});

test("append failure preserves rows and shows a footer retry", () => {
  mocks.history.items = [{ key: "1", title: "video", watchedAt: 1, video: null }];
  mocks.history.error = new Error("offline");
  const list = HistoryContent().props;
  expect(list.data).toEqual(mocks.history.items);
  expect(text(list.ListFooterComponent)).toContain("加载失败，已保留当前内容");
  elements(list.ListFooterComponent)
    .find((element) => element.props.title === "重试")
    ?.props.onPress?.();
  expect(mocks.history.retry).toHaveBeenCalledOnce();
  mocks.history.error = undefined;
  expect(text(HistoryContent().props.ListFooterComponent)).toBe("暂无更多");
});
