import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import type { SearchedUpType } from "@/api/search-up";
import type { UpSearchItem } from "@/features/bilibili-followings/merge-up-search-results";
import type { UpInfo } from "@/types";

const mocks = vi.hoisted(() => ({
  followedUps: [] as UpInfo[],
  isLoading: false,
  isReachingEnd: false,
  isValidating: false,
  searchedUps: [] as SearchedUpType[],
}));

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    default: {
      ...original,
      useEffect: () => {},
      useRef: (initial: unknown) => ({ current: initial }),
      useState: (initial: unknown) => [
        typeof initial === "function" ? (initial as () => unknown)() : initial,
        vi.fn(),
      ],
    },
  };
});
vi.mock("@react-navigation/native", () => ({ useNavigation: () => ({ navigate: vi.fn() }) }));
// app 工作区的 vitest 没有配置 @ 别名，这里用相对路径加载真实的拼装逻辑
vi.mock("@/features/bilibili-followings/merge-up-search-results", async () => {
  const actual = await import("../../features/bilibili-followings/merge-up-search-results");
  return actual;
});
vi.mock("@/api/search-up", () => ({
  useSearchUps: () => ({
    data: mocks.searchedUps,
    isLoading: mocks.isLoading,
    update: vi.fn(),
    isReachingEnd: mocks.isReachingEnd,
    isValidating: mocks.isValidating,
  }),
}));
vi.mock("@/store/followings", () => ({ useActiveFollowedUps: () => mocks.followedUps }));
vi.mock("@/store/derives", () => ({ useFollowedUpsMap: () => ({}) }));
vi.mock("@/hooks/useFollowActions", () => ({
  useFollowActions: () => ({
    disabled: false,
    follow: vi.fn(),
    isPreparing: false,
    pendingMid: "",
    unfollow: vi.fn(),
  }),
}));
vi.mock("@/components/UpName", () => ({ default: "UpName" }));
vi.mock("@/components/Avatar", () => ({ Avatar: "Avatar" }));
vi.mock("@/components/styled/rneui", () => ({
  Button: "Button",
  FlashList: "FlashList",
  Skeleton: "Skeleton",
  Text: "Text",
}));
vi.mock("@/constants/theme", () => ({
  theme: {
    text: { muted: "gray6" },
    primary: { text: "primary" },
    secondary: { text: "secondary" },
  },
}));
vi.mock("react-native", () => ({
  Keyboard: { addListener: () => ({ remove: () => {} }), metrics: () => undefined },
  Platform: { OS: "android" },
  TouchableOpacity: "TouchableOpacity",
  View: "View",
}));
vi.mock("@/utils", () => ({
  getImagePixelSize: (size: number) => size,
  parseImgUrl: String,
  parseNumber: String,
}));

import UpList from "./UpList";

type TestElement = ReactElement<{ children?: ReactNode }>;

type ListProps = {
  data: UpSearchItem[];
  ListEmptyComponent: ReactElement<{ keyword: string; loading: boolean }>;
  ListFooterComponent: TestElement | null;
  renderItem: (info: { item: UpSearchItem }) => ReactElement;
};

const localHit: UpInfo = { mid: 1, name: "UP主甲", face: "face-1", sign: "sign-1" };
const localMiss: UpInfo = { mid: 2, name: "隔壁老王", face: "face-2", sign: "sign-2" };
const apiDuplicate: SearchedUpType = {
  mid: 1,
  name: "UP主甲",
  face: "face-1",
  sign: "sign-1",
  fans: 10,
};
const apiOther: SearchedUpType = {
  mid: 3,
  name: "UP主乙",
  face: "face-3",
  sign: "sign-3",
  fans: 20,
};

function listProps(keyword: string): ListProps {
  const view = UpList({ keyword }) as unknown as ReactElement<ListProps>;
  return view.props;
}

function childElements(node: ReactNode): TestElement[] {
  return React.Children.toArray(node).filter((child): child is TestElement =>
    React.isValidElement(child),
  );
}

/** 直接调用函数组件，拿到它返回的元素（测试里所有原子组件都是字符串类型） */
function renderComponent(element: ReactElement): TestElement {
  if (typeof element.type !== "function") {
    throw new Error("期望一个函数组件");
  }
  const Component = element.type as (props: unknown) => TestElement;
  return Component(element.props);
}

function renderRow(item: UpSearchItem): TestElement[] {
  const element = listProps("up").renderItem({ item });
  return childElements(renderComponent(element).props.children);
}

/** 骨架屏元素渲染成行元素：EmptyContent 里还包了一层 SkeletonRows */
function skeletonRows(element: ReactElement): TestElement[] {
  const rendered = renderComponent(element);
  const container = typeof rendered.type === "function" ? renderComponent(rendered) : rendered;
  return childElements(container.props.children);
}

function descendantTypes(element: TestElement): unknown[] {
  return [element.type, ...childElements(element.props.children).flatMap(descendantTypes)];
}

beforeEach(() => {
  mocks.followedUps = [localHit, localMiss];
  mocks.isLoading = false;
  mocks.isReachingEnd = false;
  mocks.isValidating = false;
  mocks.searchedUps = [apiDuplicate, apiOther];
});

test("本地命中的已关注 UP 排在接口结果前面，且不与接口结果重复", () => {
  const { data } = listProps("up");

  expect(data.map((item) => item.mid)).toEqual([1, 3]);
  expect(data[0].fans).toBeUndefined();
  expect(data[1].fans).toBe(20);
});

test("本地命中项不显示粉丝数，接口结果保留粉丝数", () => {
  const localRow = renderRow(listProps("up").data[0]);
  expect(localRow.map((child) => child.type)).toEqual(["TouchableOpacity", "Button"]);

  const apiRow = renderRow(listProps("up").data[1]);
  expect(apiRow.map((child) => child.type)).toEqual(["TouchableOpacity", "Text", "Button"]);
  expect(apiRow[1].props.children).toEqual(["20", "粉丝"]);
});

test("关键词为空时没有数据并提示输入", () => {
  const { data, ListEmptyComponent } = listProps("");

  expect(data).toEqual([]);
  expect(renderComponent(ListEmptyComponent).props.children).toBe("输入UP主名称开始搜索");
});

test("首次搜索时展示骨架屏而不是空态文案", () => {
  mocks.followedUps = [];
  mocks.isLoading = true;
  mocks.isValidating = true;
  mocks.searchedUps = [];
  const { ListEmptyComponent } = listProps("up");

  expect(ListEmptyComponent.props.loading).toBe(true);
  const rows = skeletonRows(ListEmptyComponent);
  expect(rows).toHaveLength(20);
  const firstRow = renderComponent(rows[0]);
  expect(descendantTypes(firstRow).filter((type) => type === "Skeleton")).toHaveLength(4);
});

test("已有关注命中项时，接口结果加载中在列表底部补骨架屏", () => {
  mocks.isValidating = true;
  const { data, ListFooterComponent } = listProps("up");

  expect(data).toHaveLength(2);
  expect(ListFooterComponent).not.toBeNull();
  expect(skeletonRows(ListFooterComponent!)).toHaveLength(3);
});

test("已到最后一页时列表底部显示暂无更多", () => {
  mocks.isReachingEnd = true;
  const { ListFooterComponent } = listProps("up");

  expect(ListFooterComponent?.type).toBe("Text");
  expect(ListFooterComponent?.props.children).toBe("暂无更多");
});
