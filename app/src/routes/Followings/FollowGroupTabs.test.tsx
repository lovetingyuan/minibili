import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import type { FollowGroupTab } from "./FollowGroups.types";

const mocks = vi.hoisted(() => {
  function useState(initial: unknown) {
    return [initial, vi.fn()];
  }
  function useEffect() {}
  function useRef(initial: unknown) {
    return { current: initial };
  }
  return {
    useState,
    useEffect,
    useRef,
    onSelect: vi.fn(),
    onLongPress: vi.fn(),
    onCreate: vi.fn(),
  };
});

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  const originalDefault = (original as unknown as { default?: object }).default;
  return {
    ...original,
    default: {
      ...originalDefault,
      useState: mocks.useState,
      useEffect: mocks.useEffect,
      useRef: mocks.useRef,
    },
    useState: mocks.useState,
    useEffect: mocks.useEffect,
    useRef: mocks.useRef,
  };
});
vi.mock("react-native", () => ({
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  View: "View",
}));
vi.mock("@/components/styled/rneui", () => ({ Icon: "Icon", Text: "Text" }));
vi.mock("@/constants/colors.tw", () => import("../../constants/colors.tw"));

import FollowGroupTabs from "./FollowGroupTabs";

type ElementProps = {
  children?: ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean };
  onPress?: () => void;
  onLongPress?: () => void;
  className?: string;
};

function elements(node: ReactNode): ReactElement<ElementProps>[] {
  const result: ReactElement<ElementProps>[] = [];
  React.Children.forEach(node, (child) => {
    if (React.isValidElement<ElementProps>(child)) {
      result.push(child, ...elements(child.props.children));
    }
  });
  return result;
}

const tabs: FollowGroupTab[] = [
  { key: "all", tagid: null, name: "全部", count: 48, custom: false },
  { key: "tag--10", tagid: -10, name: "特别关注", count: 1, custom: false },
  { key: "tag-446542", tagid: 446542, name: "考研", count: 2, custom: true },
];

function render(selectedKey = "all", disabled = false) {
  return elements(
    FollowGroupTabs({
      tabs,
      selectedKey,
      disabled,
      onSelect: mocks.onSelect,
      onLongPress: mocks.onLongPress,
      onCreate: mocks.onCreate,
    }),
  );
}

function tab(label: string, rendered = render()) {
  return rendered.find((element) => element.props.accessibilityLabel === label)!;
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("展示全部与分组数量，并标出当前选中项", () => {
  const rendered = render("tag--10");
  const labels = rendered
    .filter((element) => element.props.accessibilityLabel?.includes("个关注"))
    .map((element) => element.props.accessibilityLabel);
  expect(labels).toEqual(["全部，48 个关注", "特别关注，1 个关注", "考研，2 个关注"]);
  expect(
    rendered.find((element) => element.props.accessibilityLabel === "特别关注，1 个关注")!.props
      .accessibilityState,
  ).toEqual({ selected: true, disabled: false });
  expect(tab("全部，48 个关注", rendered).props.accessibilityState).toEqual({
    selected: false,
    disabled: false,
  });
});

test("点击分组切换，只有自定义分组支持长按菜单", () => {
  const rendered = render();
  tab("考研，2 个关注", rendered).props.onPress?.();
  expect(mocks.onSelect).toHaveBeenCalledWith(tabs[2]);

  expect(tab("考研，2 个关注", rendered).props.accessibilityHint).toBe("长按打开分组操作菜单");
  expect(tab("全部，48 个关注", rendered).props.onLongPress).toBeUndefined();
  tab("考研，2 个关注", rendered).props.onLongPress?.();
  expect(mocks.onLongPress).toHaveBeenCalledWith(tabs[2]);
});

test("右侧加号用于新建分组，禁用时不再响应", () => {
  const create = render().find((element) => element.props.accessibilityLabel === "新建分组")!;
  create.props.onPress?.();
  expect(mocks.onCreate).toHaveBeenCalledOnce();

  const disabledRendered = render("all", true);
  const disabled = disabledRendered.find(
    (element) => element.props.accessibilityLabel === "新建分组",
  )!;
  expect(disabled.props.accessibilityState).toEqual({ disabled: true });
  expect(tab("全部，48 个关注", disabledRendered).props.accessibilityState?.disabled).toBe(true);
});
