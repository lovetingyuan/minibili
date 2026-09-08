import React from "react";
import type { ReactElement, ReactNode } from "react";
import { expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  livingUps: {} as Record<string, string>,
  followingDynamicsUpdateCount: 0,
}));

vi.mock("@react-navigation/bottom-tabs", () => ({
  createBottomTabNavigator: () => ({ Navigator: "TabNavigator", Screen: "TabScreen" }),
}));
vi.mock("@react-navigation/native-stack", () => ({
  createNativeStackNavigator: () => ({ Navigator: "StackNavigator", Screen: "StackScreen" }),
}));
vi.mock("@react-navigation/elements", () => ({ Assets: [] }));
vi.mock("@react-navigation/native", () => ({ NavigationContainer: "NavigationContainer" }));
vi.mock("expo-asset", () => ({ Asset: { loadAsync: vi.fn() } }));
vi.mock("@/components/styled/rneui", () => ({ Icon: "Icon" }));
vi.mock("@/api/check-update", () => ({
  useAppUpdateInfo: () => ({ hasUpdate: false }),
}));
vi.mock("@/constants/colors.tw", () => ({
  colors: { primary: { text: "primary" }, gray6: { text: "gray6" }, gray8: { text: "gray8" } },
}));
vi.mock("@/hooks/useResolvedColor", () => ({ default: (value: string) => value }));
vi.mock("@/hooks/useRouteTheme", () => ({ default: () => ({}) }));
vi.mock("@/store", () => ({
  useStore: () => ({
    $firstRun: 1,
    initialed: true,
    livingUps: mocks.livingUps,
    followingDynamicsUpdateCount: mocks.followingDynamicsUpdateCount,
  }),
}));
vi.mock("./About", () => ({ default: "About" }));
vi.mock("./Dynamic", () => ({ default: "Dynamic" }));
vi.mock("./DynamicDetail", () => ({ default: "DynamicDetail" }));
vi.mock("./Followings/BilibiliAccountGate", () => ({ default: "BilibiliAccountGate" }));
vi.mock("./Followings/FavoritesContent", () => ({ default: "FavoritesContent" }));
vi.mock("./Followings/FollowingDynamicsContent", () => ({
  default: "FollowingDynamicsContent",
}));
vi.mock("./Followings/FollowingsContent", () => ({ default: "FollowingsContent" }));
vi.mock("./Followings/HistoryContent", () => ({ default: "HistoryContent" }));
vi.mock("./Living", () => ({ default: "Living" }));
vi.mock("./Play", () => ({ default: "Play" }));
vi.mock("./SearchVideos", () => ({ default: "SearchVideos" }));
vi.mock("./VideoList", () => ({ default: "VideoList" }));
vi.mock("./WebPage", () => ({ default: "WebPage" }));
vi.mock("./Welcome", () => ({ default: "Welcome" }));

import AppRoute, { FollowingDynamicsRoute, FollowingsRoute, MainTabs } from "./Index";

type TabScreenProps = {
  name: string;
  component: React.ComponentType;
  options: {
    title: string;
    headerTitle?: string;
    tabBarBadge?: string | number;
    tabBarBadgeStyle?: Record<string, unknown>;
  };
};

function tabScreens(node: ReactNode) {
  if (!React.isValidElement<{ children?: ReactNode }>(node)) {
    throw new Error("Missing tab navigator");
  }
  return React.Children.toArray(node.props.children).filter(
    (child): child is ReactElement<TabScreenProps> => React.isValidElement<TabScreenProps>(child),
  );
}

type ElementProps = { children?: ReactNode } & Record<string, unknown>;

function elements(node: ReactNode): ReactElement<ElementProps>[] {
  const result: ReactElement<ElementProps>[] = [];
  React.Children.forEach(node, (child) => {
    if (React.isValidElement<ElementProps>(child)) {
      result.push(child, ...elements(child.props.children));
    }
  });
  return result;
}

test("main tabs keep the requested order, labels, and default route", () => {
  const tabs = MainTabs();
  expect(tabs.props.initialRouteName).toBe("Hot");
  const screens = tabScreens(tabs);
  expect(screens.map((screen) => screen.props.name)).toEqual([
    "Hot",
    "FollowingDynamics",
    "Followings",
    "Mine",
  ]);
  expect(screens.map((screen) => screen.props.options.title)).toEqual([
    "热门",
    "动态",
    "关注",
    "我的",
  ]);
  expect(screens[0].props.component).toBe("VideoList");
  expect(screens[1].props.options.headerTitle).toBe("关注的动态");
  expect(screens[3].props.component).toBe("About");
});

test("followings tab shows the live badge only while followed ups are live", () => {
  mocks.livingUps = { 1625060795: "https://live.bilibili.com/25334922" };
  const withBadge = tabScreens(MainTabs());
  expect(withBadge[2].props.options.tabBarBadge).toBe("𝘭𝘪𝘷𝘦");
  expect(withBadge[2].props.options.tabBarBadgeStyle).toMatchObject({
    backgroundColor: "#00AEEC",
  });

  mocks.livingUps = {};
  const withoutBadge = tabScreens(MainTabs());
  expect(withoutBadge[2].props.options.tabBarBadge).toBeUndefined();
});

test("dynamics tab shows the unread count badge and caps it at 99+", () => {
  mocks.followingDynamicsUpdateCount = 7;
  expect(tabScreens(MainTabs())[1].props.options.tabBarBadge).toBe(7);

  mocks.followingDynamicsUpdateCount = 150;
  expect(tabScreens(MainTabs())[1].props.options.tabBarBadge).toBe("99+");

  mocks.followingDynamicsUpdateCount = 0;
  expect(tabScreens(MainTabs())[1].props.options.tabBarBadge).toBeUndefined();
});

test("account tabs render their direct list content through the shared gate", () => {
  const dynamics = FollowingDynamicsRoute() as ReactElement<{ Content: React.ComponentType }>;
  const followings = FollowingsRoute() as ReactElement<{ Content: React.ComponentType }>;

  expect(dynamics.type).toBe("BilibiliAccountGate");
  expect(dynamics.props.Content).toBe("FollowingDynamicsContent");
  expect(followings.type).toBe("BilibiliAccountGate");
  expect(followings.props.Content).toBe("FollowingsContent");
});

test("full-screen routes live above the tab navigator", () => {
  const screens = elements(AppRoute()).filter(
    (
      element,
    ): element is ReactElement<
      ElementProps & { name: string; options?: { headerShown?: boolean } }
    > => element.type === "StackScreen",
  );

  expect(screens.map((screen) => screen.props.name)).toEqual([
    "Welcome",
    "MainTabs",
    "SearchVideos",
    "Dynamic",
    "Play",
    "Living",
    "DynamicDetail",
    "WebPage",
    "Favorites",
    "History",
  ]);
  expect(screens.find((screen) => screen.props.name === "MainTabs")?.props.options).toEqual({
    headerShown: false,
  });
});
