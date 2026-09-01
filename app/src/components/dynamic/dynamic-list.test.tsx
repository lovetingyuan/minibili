import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { DynamicItem } from "@/api/dynamic-items.type";

vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  Pressable: "Pressable",
  View: "View",
}));
vi.mock("@/components/styled/rneui", () => ({
  Button: "Button",
  FlashList: "FlashList",
  Skeleton: "Skeleton",
  Text: "Text",
}));
vi.mock("@/constants/colors.tw", () => import("../../constants/colors.tw"));
vi.mock("./dynamic-card", () => ({ DynamicCard: "DynamicCard" }));

import { DynamicList } from "./dynamic-list";
import type { DynamicListProps } from "./dynamic-list.types";

const actions = {
  refresh: vi.fn(),
  loadMore: vi.fn(),
  retry: vi.fn(),
  onItemPress: vi.fn(),
};

const item = {
  id: "dynamic-1",
  sourceType: "DYNAMIC_TYPE_WORD",
  author: { mid: 1, name: "UP", face: "" },
  date: "刚刚",
  time: 0,
  pubAction: "发布了动态",
  top: false,
  text: "动态正文",
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

const baseProps = {
  list: [],
  error: undefined,
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: false,
  isReachingEnd: false,
  loadingText: "正在加载关注动态",
  emptyTitle: "这里还没有关注动态",
  emptyMessage: "暂时没有新动态",
  ...actions,
} satisfies DynamicListProps;

function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!React.isValidElement<{ children?: ReactNode }>(node)) return "";
  return React.Children.toArray(node.props.children).map(text).join("");
}

type TestElementProps = { children?: ReactNode; onPress?: () => void };

function renderFunction(element: ReactElement): ReactElement<TestElementProps> {
  if (typeof element.type !== "function") throw new Error("Expected a function component");
  const Component = element.type as (props: typeof element.props) => ReactElement<TestElementProps>;
  return Component(element.props);
}

type ListProps = {
  ListEmptyComponent: ReactElement;
  ListFooterComponent: ReactElement<TestElementProps> | null;
  refreshing: boolean;
  renderItem: (info: { item: DynamicItem }) => ReactElement<{
    children: ReactElement<{ onPress: () => void }>;
  }>;
  onRefresh: () => void;
  onEndReached: () => void;
};

describe("shared dynamic list", () => {
  beforeEach(() => vi.clearAllMocks());

  test("shows the configured initial loading state", () => {
    const loading = DynamicList({ ...baseProps, isLoading: true });
    expect(text(renderFunction(loading))).toContain("正在加载关注动态");
  });

  test("shows empty and error states and retries a failed first page", () => {
    const empty = DynamicList(baseProps) as ReactElement<ListProps>;
    expect(text(renderFunction(empty.props.ListEmptyComponent))).toContain("这里还没有关注动态");

    const failed = DynamicList({ ...baseProps, error: new Error("登录已失效") }) as ReactElement<ListProps>;
    const errorState = renderFunction(failed.props.ListEmptyComponent);
    expect(text(errorState)).toContain("登录已失效");
    const button = React.Children.toArray(errorState.props.children).find(
      (child) => React.isValidElement(child) && child.type === "Button",
    );
    if (!React.isValidElement<{ onPress: () => void }>(button)) throw new Error("Missing retry");
    button.props.onPress();
    expect(actions.retry).toHaveBeenCalledOnce();
  });

  test("forwards item presses, refreshes and lazy-loads", () => {
    const list = DynamicList({ ...baseProps, list: [item], isRefreshing: true }) as ReactElement<ListProps>;
    const row = list.props.renderItem({ item });
    const card = row.props.children;
    card.props.onPress();
    list.props.onRefresh();
    list.props.onEndReached();
    expect(actions.onItemPress).toHaveBeenCalledWith(item);
    expect(actions.refresh).toHaveBeenCalledOnce();
    expect(actions.loadMore).toHaveBeenCalledOnce();
    expect(list.props.refreshing).toBe(true);
    expect(text(list.props.ListFooterComponent)).toContain("上拉加载更多");
  });

  test("shows continuation progress, terminal state and retry", () => {
    const loading = DynamicList({ ...baseProps, list: [item], isLoadingMore: true }) as ReactElement<ListProps>;
    expect(text(loading.props.ListFooterComponent)).toBe("");

    const terminal = DynamicList({ ...baseProps, list: [item], isReachingEnd: true }) as ReactElement<ListProps>;
    expect(text(terminal.props.ListFooterComponent)).toContain("暂无更多");

    const failed = DynamicList({ ...baseProps, list: [item], error: new Error("续页失败") }) as ReactElement<ListProps>;
    expect(text(failed.props.ListFooterComponent)).toContain("加载下一页失败，点击重试");
    failed.props.ListFooterComponent?.props.onPress?.();
    expect(actions.retry).toHaveBeenCalledOnce();
  });
});
