import { beforeEach, expect, test, vi } from "vitest";

import type { UpInfo } from "@/types";

const mocks = vi.hoisted(() => ({
  items: [] as UpInfo[],
}));

// 组件里用到了 usePullToRefresh，这里把 react 的 hook 换成同步实现
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  const mockedReact = {
    ...actual,
    useRef: (initial: unknown) => ({ current: initial }),
    useState: () => [false, vi.fn()] as const,
  };
  return { ...mockedReact, default: mockedReact };
});
vi.mock("react-native", () => ({ ActivityIndicator: "ActivityIndicator", View: "View" }));
// app 工作区的 vitest 没有配置 @ 别名，这里用相对路径加载真实的 hook
vi.mock(
  "@/hooks/usePullToRefresh",
  async () => await vi.importActual("../../hooks/usePullToRefresh"),
);
vi.mock("@/api/relation-tags", () => ({ RELATION_TAG_SPECIAL_ID: -10 }));
vi.mock("@/api/useBilibiliRelationTags", () => ({
  useBilibiliRelationTagMembers: () => ({
    items: mocks.items,
    refresh: vi.fn(),
    loadMore: vi.fn(),
    mutate: vi.fn(),
    isLoading: false,
    isValidating: false,
    isLoadingMore: false,
    hasMore: false,
    error: undefined,
  }),
}));
vi.mock("@/components/styled/rneui", () => ({ Button: "Button", Text: "Text" }));
vi.mock("@/constants/theme", () => ({ theme: { text: { muted: "text-gray" } } }));
vi.mock("@/features/bilibili-followings/order-followings", () => ({
  orderFollowedUps: (ups: UpInfo[]) => ups,
}));
vi.mock("@/store", () => ({ useStore: () => ({ livingUps: {} }) }));
vi.mock("@/store/derives", () => ({ useUnreadUpMids: () => new Set() }));
vi.mock("./FollowUpsGrid", () => ({ default: "FollowUpsGrid" }));

import GroupUpList from "./GroupUpList";

const current: UpInfo = { mid: 10, name: "当前特别关注", face: "", sign: "" };
const stale: UpInfo = { mid: 11, name: "已移出特别关注", face: "", sign: "" };

beforeEach(() => {
  mocks.items = [current, stale];
});

test("已访问的特别关注页按最新成员集合过滤分页缓存", () => {
  const view = GroupUpList({ tagid: -10, specialMids: new Set(["10"]) });

  expect(view.props.ups).toEqual([current]);
});

test("其他分组不使用特别关注集合过滤成员", () => {
  const view = GroupUpList({ tagid: 446542, specialMids: new Set(["10"]) });

  expect(view.props.ups).toEqual([current, stale]);
});
