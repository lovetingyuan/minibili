import React from "react";
import type { ComponentProps, ElementType, ReactElement, ReactNode } from "react";
import type { ScrollViewProps, ViewProps } from "react-native";
import type PagerView from "react-native-pager-view";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  nativeAvailable: false,
  hasViewManagerConfig: vi.fn(),
  nativeRef: { current: { setPage: vi.fn() } },
  scrollRef: { current: { scrollTo: vi.fn() } },
  currentPage: { current: 0 },
  stateIndex: 0,
  refIndex: 0,
  values: [0, false, false, false, 360] as unknown[],
  effects: [] as (() => void)[],
}));

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    default: {
      ...original,
      useRef: () => [mocks.nativeRef, mocks.scrollRef, mocks.currentPage][mocks.refIndex++],
      useState: () => {
        const index = mocks.stateIndex++;
        return [
          mocks.values[index],
          (value: unknown) => {
            mocks.values[index] = value;
          },
        ];
      },
      useEffect: (effect: () => void) => {
        mocks.effects.push(effect);
      },
    },
  };
});
vi.mock("react-native", () => ({
  View: "View",
  ScrollView: "ScrollView",
  Pressable: "Pressable",
  Keyboard: { dismiss: vi.fn() },
  UIManager: { hasViewManagerConfig: mocks.hasViewManagerConfig },
  useWindowDimensions: () => ({ width: 360, height: 800 }),
}));
vi.mock("react-native-pager-view", () => ({ default: "PagerView" }));
vi.mock("uniwind", () => ({ useResolveClassNames: () => ({ flex: 1 }) }));
vi.mock("@/components/styled/rneui", () => ({ Text: "Text" }));
vi.mock("@/constants/colors.tw", () => import("../../constants/colors.tw"));
vi.mock("./FollowingsContent", () => ({ default: "FollowingsContent" }));
vi.mock("./FollowingDynamicsContent", () => ({ default: "FollowingDynamicsContent" }));
vi.mock("./FavoritesContent", () => ({ default: "FavoritesContent" }));
vi.mock("./HistoryContent", () => ({ default: "HistoryContent" }));

import FollowPages from "./FollowPages";

function elements(node: ReactNode): ReactElement<{ children?: ReactNode }>[] {
  const result: ReactElement<{ children?: ReactNode }>[] = [];
  React.Children.forEach(node, (child) => {
    if (React.isValidElement<{ children?: ReactNode }>(child)) {
      result.push(child, ...elements(child.props.children));
    }
  });
  return result;
}

function find<Props>(node: ReactNode, type: ElementType | string): ReactElement<Props> {
  const match = elements(node).find((element) => element.type === type);
  if (!React.isValidElement<Props>(match)) throw new Error(`Missing ${type}`);
  return match;
}

function render() {
  mocks.stateIndex = 0;
  mocks.refIndex = 0;
  return FollowPages();
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.hasViewManagerConfig.mockImplementation(() => mocks.nativeAvailable);
  mocks.nativeAvailable = false;
  mocks.currentPage.current = 0;
  mocks.values = [0, false, false, false, 360];
  mocks.effects = [];
});

describe("Follow pager native compatibility", () => {
  test.each([false, true])("history tab is lazy and remains mounted (native=%s)", (native) => {
    mocks.nativeAvailable = native;
    const tabs = elements(render()).filter((element) => element.type === "Pressable");
    expect(
      tabs.map((tab) => {
        if (!React.isValidElement<{ accessibilityLabel: string }>(tab))
          throw new Error("Missing tab");
        return tab.props.accessibilityLabel;
      }),
    ).toEqual(["关注动态", "我的关注", "我的收藏", "观看历史"]);
    if (!React.isValidElement<{ onPress: () => void }>(tabs[3]))
      throw new Error("Missing history tab");
    tabs[3].props.onPress();
    if (native) expect(mocks.nativeRef.current.setPage).toHaveBeenCalledWith(3);
    else expect(mocks.scrollRef.current.scrollTo).toHaveBeenCalledWith({ x: 1080, animated: true });
    const visited = render();
    expect(elements(visited).some((element) => element.type === "HistoryContent")).toBe(true);
    expect(elements(visited).some((element) => element.type === "FollowingsContent")).toBe(false);
    expect(elements(visited).some((element) => element.type === "FavoritesContent")).toBe(false);
    find<{ onPress: () => void }>(visited, "Pressable").props.onPress();
    expect(elements(render()).some((element) => element.type === "HistoryContent")).toBe(true);
  });

  test.each([false, true])(
    "swiping to history mounts it and updates selection (native=%s)",
    (native) => {
      mocks.nativeAvailable = native;
      const root = render();
      if (native) {
        find<ComponentProps<typeof PagerView>>(root, "PagerView").props.onPageSelected?.({
          nativeEvent: { position: 3 },
        } as Parameters<NonNullable<ComponentProps<typeof PagerView>["onPageSelected"]>>[0]);
      } else {
        find<ScrollViewProps>(root, "ScrollView").props.onMomentumScrollEnd?.({
          nativeEvent: { contentOffset: { x: 1080 }, layoutMeasurement: { width: 360 } },
        } as Parameters<NonNullable<ScrollViewProps["onMomentumScrollEnd"]>>[0]);
      }
      expect(mocks.values.slice(0, 4)).toEqual([3, false, false, true]);
      expect(elements(render()).some((element) => element.type === "HistoryContent")).toBe(true);
    },
  );

  test("never mounts the missing native manager and retains lazy favorites", () => {
    const root = render();
    expect(mocks.hasViewManagerConfig).toHaveBeenCalledWith("RNCViewPager");
    expect(elements(root).some((element) => element.type === "PagerView")).toBe(false);
    expect(elements(root).some((element) => element.type === "FollowingDynamicsContent")).toBe(true);
    expect(elements(root).some((element) => element.type === "FollowingsContent")).toBe(false);
    expect(elements(root).some((element) => element.type === "FavoritesContent")).toBe(false);
    expect(elements(root).some((element) => element.type === "HistoryContent")).toBe(false);
    const scroll = find<ScrollViewProps>(root, "ScrollView");
    expect(scroll.props.horizontal).toBe(true);
    expect(scroll.props.pagingEnabled).toBe(true);
  });

  test("clicking favorites scrolls the fallback and preserves mounted pages after returning", () => {
    const tabs = elements(render()).filter((element) => element.type === "Pressable");
    if (!React.isValidElement<{ onPress: () => void }>(tabs[2]))
      throw new Error("Missing favorites tab");
    tabs[2].props.onPress();
    expect(mocks.scrollRef.current.scrollTo).toHaveBeenCalledWith({ x: 720, animated: true });
    expect(mocks.nativeRef.current.setPage).not.toHaveBeenCalled();
    expect(mocks.values.slice(0, 3)).toEqual([2, false, true]);
    const mounted = render();
    expect(elements(mounted).some((element) => element.type === "FavoritesContent")).toBe(true);
    const first = find<{ onPress: () => void }>(mounted, "Pressable");
    first.props.onPress();
    expect(mocks.values.slice(0, 3)).toEqual([0, false, true]);
  });

  test("swipe events update the selected tab and width changes retain the selected page", () => {
    const scroll = find<ScrollViewProps>(render(), "ScrollView");
    scroll.props.onMomentumScrollEnd?.({
      nativeEvent: { contentOffset: { x: 360 }, layoutMeasurement: { width: 360 } },
    } as Parameters<NonNullable<ScrollViewProps["onMomentumScrollEnd"]>>[0]);
    expect(mocks.values.slice(0, 2)).toEqual([1, true]);
    const layout = elements(render()).find((element) => "onLayout" in element.props);
    if (!React.isValidElement<ViewProps>(layout)) throw new Error("Missing layout handler");
    layout.props.onLayout?.({ nativeEvent: { layout: { width: 500 } } } as Parameters<
      NonNullable<ViewProps["onLayout"]>
    >[0]);
    render();
    mocks.effects.at(-1)?.();
    expect(mocks.scrollRef.current.scrollTo).toHaveBeenLastCalledWith({ x: 500, animated: false });
  });

  test("new binaries continue using PagerView and synchronize native swipe events", () => {
    mocks.nativeAvailable = true;
    const root = render();
    expect(elements(root).some((element) => element.type === "ScrollView")).toBe(false);
    const pager = find<ComponentProps<typeof PagerView>>(root, "PagerView");
    find<{ onPress: () => void }>(root, "Pressable").props.onPress();
    expect(mocks.nativeRef.current.setPage).toHaveBeenCalledWith(0);
    pager.props.onPageSelected?.({ nativeEvent: { position: 1 } } as Parameters<
      NonNullable<ComponentProps<typeof PagerView>["onPageSelected"]>
    >[0]);
    expect(mocks.values.slice(0, 2)).toEqual([1, true]);
  });
});
