import type { ComponentProps, ReactElement } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { DynamicItem } from "@/api/dynamic-items.type";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  refresh: vi.fn(),
  userInfo: undefined as
    | {
        face: string;
        level: number;
        mid: string;
        name: string;
        officialDescription: string;
        sex: string;
        sign: string;
      }
    | undefined,
}));

vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  Pressable: "Pressable",
  View: "View",
}));
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  const mockedReact = {
    ...actual,
    useRef: <T,>(initialValue: T) => ({ current: initialValue }),
    useState: <T,>(initialValue: T) => [initialValue, vi.fn()] as const,
  };
  return { ...mockedReact, default: mockedReact };
});
vi.mock("react-native-pager-view", () => ({ default: "PagerView" }));
vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mocks.navigate }),
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
vi.mock("@/api/space-items", () => ({
  useSpaceContentCounts: () => ({ videoCount: 513, opusCount: 366 }),
  useSpaceOpusItems: vi.fn(),
  useSpaceVideoItems: vi.fn(),
}));
vi.mock("@/api/user-info", () => ({
  useUserInfo: () => ({ data: mocks.userInfo }),
}));
vi.mock("@/components/dynamic/dynamic-list", () => ({ DynamicList: "DynamicList" }));
vi.mock(
  "@/components/dynamic/dynamic-target",
  async () => await vi.importActual("../../components/dynamic/dynamic-target"),
);
vi.mock(
  "@/components/dynamic/use-open-dynamic-item",
  async () => await vi.importActual("../../components/dynamic/use-open-dynamic-item"),
);
vi.mock("@/components/styled/rneui", () => ({
  Button: "Button",
  FlashList: "FlashList",
  Skeleton: "Skeleton",
  Text: "Text",
}));
vi.mock("@/constants/theme", () => import("../../constants/theme"));
vi.mock("@/hooks/useUpdateNavigationOptions", () => ({ default: vi.fn() }));
vi.mock("@/store/actions", () => ({ useMarkFollowingDynamicsRead: vi.fn() }));
vi.mock("./Header", () => ({ headerRight: vi.fn(), headerTitle: vi.fn() }));
vi.mock("./ProfileInfo", () => ({ default: "ProfileInfo" }));
vi.mock("./SpaceTabs", () => ({ default: "SpaceTabs" }));

import Dynamic from "./index";

type ListProps = {
  listHeader: ReactElement<{
    officialDescription?: string;
    sign?: string;
  }>;
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
  title: "",
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

function renderList(routeSign = "") {
  const screen = Dynamic({
    route: {
      key: "Dynamic-test",
      name: "Dynamic",
      params: { user: { mid: 123, name: "UP", face: "", sign: routeSign } },
    },
    navigation: { navigate: mocks.navigate },
  } as unknown as ComponentProps<typeof Dynamic>);
  const root = screen as ReactElement<{
    children: readonly [ReactElement, ReactElement<{ children: readonly ReactElement[] }>];
  }>;
  const pager = root.props.children[1];
  const dynamicPage = pager.props.children[0] as ReactElement<{ children: ReactElement }>;
  const feed = dynamicPage.props.children;
  const renderFeed = feed.type as (props: typeof feed.props) => ReactElement<ListProps>;
  return renderFeed(feed.props);
}

function pressRenderedCard(item: DynamicItem) {
  renderList().props.onItemPress(item);
}

describe("Dynamic list navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userInfo = undefined;
  });

  test("passes the latest UP introduction and signature to the list header", () => {
    mocks.userInfo = {
      face: "avatar.jpg",
      level: 6,
      mid: "123",
      name: "UP",
      officialDescription: "认证UP主",
      sex: "保密",
      sign: "最新签名",
    };

    const profile = renderList("缓存签名").props.listHeader;

    expect(profile.type).toBe("ProfileInfo");
    expect(profile.props).toEqual({
      officialDescription: "认证UP主",
      sign: "最新签名",
    });
  });

  test("uses the cached signature while the UP profile is unavailable", () => {
    expect(renderList("缓存签名").props.listHeader.props).toEqual({
      officialDescription: undefined,
      sign: "缓存签名",
    });
  });

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
