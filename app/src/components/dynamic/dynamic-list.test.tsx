import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { DynamicItem } from "@/api/dynamic-items.type";

const mocks = vi.hoisted(() => {
  const navigation = {
    addListener: vi.fn(),
    isFocused: vi.fn(() => true),
  };
  const state = {
    // 每次渲染都会重置的 hook 顺序，用于给 useRef / useEffect 分配稳定的位置
    hookIndex: 0,
    refs: [] as { current: unknown }[],
    deps: [] as (readonly unknown[] | undefined)[],
  };
  return {
    navigation,
    state,
    scrollToOffset: vi.fn(),
    effects: [] as (() => void | (() => void))[],
    tabPressListener: undefined as (() => void) | undefined,
    startRender: () => {
      state.hookIndex = 0;
    },
  };
});

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    default: {
      ...original,
      useRef: (current: unknown) => {
        const index = mocks.state.hookIndex++;
        const ref = (mocks.state.refs[index] ??= { current });
        return ref;
      },
      useEffect: (effect: () => void | (() => void), deps?: readonly unknown[]) => {
        const index = mocks.state.hookIndex++;
        const previous = mocks.state.deps[index];
        mocks.state.deps[index] = deps;
        const changed =
          !previous ||
          !deps ||
          deps.length !== previous.length ||
          deps.some((dep, depIndex) => !Object.is(dep, previous[depIndex]));
        if (changed) {
          mocks.effects.push(effect);
        }
      },
    },
  };
});
vi.mock("@react-navigation/native", () => ({ useNavigation: () => mocks.navigation }));
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
vi.mock("@/constants/theme", () => import("../../constants/theme"));
vi.mock("@/components/LoginRequired", () => ({ LoginRequired: "LoginRequired" }));
vi.mock("@/features/bilibili-session/login-required", () => ({
  isLoginRequiredError: () => false,
}));
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
  title: "",
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
  emptyTitle: "这里还没有关注动态",
  emptyMessage: "暂时没有新动态",
  ...actions,
} satisfies DynamicListProps;

const refreshedItem = {
  ...item,
  id: "dynamic-2",
  text: "刷新出来的新动态",
} satisfies DynamicItem;

function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (!React.isValidElement<{ children?: ReactNode }>(node)) {
    return "";
  }
  return React.Children.toArray(node.props.children).map(text).join("");
}

function containsType(node: ReactNode, type: string): boolean {
  if (!React.isValidElement<{ children?: ReactNode }>(node)) {
    return false;
  }
  if (node.type === type) {
    return true;
  }
  return React.Children.toArray(node.props.children).some((child) => containsType(child, type));
}

type TestElementProps = { children?: ReactNode; onPress?: () => void };

function renderFunction(element: ReactElement): ReactElement<TestElementProps> {
  if (typeof element.type !== "function") {
    throw new Error("Expected a function component");
  }
  const Component = element.type as (props: typeof element.props) => ReactElement<TestElementProps>;
  return Component(element.props);
}

type ListProps = {
  ListEmptyComponent: ReactElement;
  ListFooterComponent: ReactElement<TestElementProps> | null;
  ListHeaderComponent: ReactNode;
  refreshing: boolean;
  renderItem: (info: { item: DynamicItem }) => ReactElement<{
    children: ReactElement<{ onPress: () => void }>;
    className?: string;
  }>;
  onRefresh: () => void;
  onEndReached: () => void;
};

type TestProps = Partial<DynamicListProps> & Pick<DynamicListProps, "list">;

// 模拟一次完整的 render → commit：hook 位置稳定，依赖变化的副作用在提交后执行
function renderList(props: TestProps = { list: [] }): ReactElement<ListProps> {
  mocks.startRender();
  mocks.effects.length = 0;
  const element = DynamicList({ ...baseProps, ...props }) as ReactElement<ListProps>;
  // 列表挂载时拿到实例，卸载时置空（refs[0] 即组件的 listRef）
  mocks.state.refs[0].current =
    element.type === "FlashList" ? { scrollToOffset: mocks.scrollToOffset } : null;
  for (const effect of mocks.effects.splice(0)) {
    effect();
  }
  return element;
}

describe("shared dynamic list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tabPressListener = undefined;
    mocks.effects.length = 0;
    mocks.state.refs.length = 0;
    mocks.state.deps.length = 0;
    mocks.navigation.isFocused.mockReturnValue(true);
    mocks.navigation.addListener.mockImplementation((_event, listener: () => void) => {
      mocks.tabPressListener = listener;
      return vi.fn();
    });
  });

  test("shows skeletons without loading text in the initial loading state", () => {
    const loading = renderList({ list: [], isLoading: true });
    const loadingState = renderFunction(loading);
    expect(text(loadingState)).toBe("");
    expect(containsType(loadingState, "Skeleton")).toBe(true);
  });

  test("keeps the optional header above loading, empty and populated content", () => {
    const listHeader = React.createElement("ProfileInfo", null, "UP资料");

    const loading = renderList({ list: [], isLoading: true, listHeader });
    expect(text(renderFunction(loading)).startsWith("UP资料")).toBe(true);

    const empty = renderList({ list: [], listHeader });
    expect(text(empty.props.ListHeaderComponent)).toBe("UP资料");

    const populated = renderList({ list: [item], listHeader });
    expect(text(populated.props.ListHeaderComponent)).toBe("UP资料");

    expect(renderList({ list: [] }).props.ListHeaderComponent).toBeNull();
  });

  test("uses a larger gap between dynamic cards", () => {
    const list = renderList({ list: [item] });
    const row = list.props.renderItem({ item });

    expect(row.props.className).toBe("mb-3");
  });

  test("shows empty and error states and retries a failed first page", () => {
    const empty = renderList({ list: [] });
    expect(text(renderFunction(empty.props.ListEmptyComponent))).toContain("这里还没有关注动态");

    const failed = renderList({
      list: [],
      error: new Error("登录已失效"),
    });
    const errorState = renderFunction(failed.props.ListEmptyComponent);
    expect(text(errorState)).toContain("动态加载失败");
    expect(text(errorState)).toContain("请检查网络后重试");
    // 接口返回的错误码和请求路径不给用户看
    expect(text(errorState)).not.toContain("登录已失效");
    const button = React.Children.toArray(errorState.props.children).find(
      (child) => React.isValidElement(child) && child.type === "Button",
    );
    if (!React.isValidElement<{ onPress: () => void }>(button)) {
      throw new Error("Missing retry");
    }
    button.props.onPress();
    expect(actions.retry).toHaveBeenCalledOnce();
  });

  test("forwards item presses, refreshes and lazy-loads", () => {
    const list = renderList({
      list: [item],
      isRefreshing: true,
    });
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
    const loading = renderList({
      list: [item],
      isLoadingMore: true,
    });
    expect(text(loading.props.ListFooterComponent)).toBe("");

    const terminal = renderList({
      list: [item],
      isReachingEnd: true,
    });
    expect(text(terminal.props.ListFooterComponent)).toContain("暂无更多");

    const failed = renderList({
      list: [item],
      error: new Error("续页失败"),
    });
    expect(text(failed.props.ListFooterComponent)).toContain("加载下一页失败，点击重试");
    failed.props.ListFooterComponent?.props.onPress?.();
    expect(actions.retry).toHaveBeenCalledOnce();
  });

  test("reselecting the focused tab refreshes first, then scrolls to the top after the new list lands", () => {
    const onTabReselect = vi.fn();

    renderList({ list: [item], onTabReselect });
    mocks.navigation.isFocused.mockReturnValue(false);
    mocks.tabPressListener?.();
    expect(onTabReselect).not.toHaveBeenCalled();
    expect(mocks.scrollToOffset).not.toHaveBeenCalled();

    mocks.navigation.isFocused.mockReturnValue(true);
    mocks.tabPressListener?.();
    expect(onTabReselect).toHaveBeenCalledOnce();
    expect(mocks.scrollToOffset).not.toHaveBeenCalled();

    // 刷新中，列表还是旧数据，此时不能滚动
    renderList({ list: [item], isRefreshing: true, onTabReselect });
    expect(mocks.scrollToOffset).not.toHaveBeenCalled();

    // 新列表渲染完成后再滚动到顶部
    renderList({ list: [refreshedItem, item], onTabReselect });
    expect(mocks.scrollToOffset).toHaveBeenCalledExactlyOnceWith({ offset: 0, animated: true });

    // 请求只消费一次，后续渲染不会重复滚动
    renderList({ list: [refreshedItem, item], onTabReselect });
    expect(mocks.scrollToOffset).toHaveBeenCalledOnce();
  });

  test("a refresh that does not come from the tab press keeps the scroll position", () => {
    renderList({ list: [item] });
    renderList({ list: [item], isRefreshing: true });
    renderList({ list: [refreshedItem, item] });
    expect(mocks.scrollToOffset).not.toHaveBeenCalled();
  });
});
