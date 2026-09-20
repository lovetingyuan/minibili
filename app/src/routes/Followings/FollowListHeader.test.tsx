import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  options: undefined as Partial<BottomTabNavigationOptions> | undefined,
}));

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mocks.navigate }),
}));
vi.mock("@/hooks/useUpdateNavigationOptions", () => ({
  default: (options: Partial<BottomTabNavigationOptions>) => {
    mocks.options = options;
  },
}));
vi.mock("react-native", () => ({ View: "View" }));
vi.mock("@/components/styled/rneui", () => ({ Button: "Button", Icon: "Icon" }));
vi.mock("@/constants/colors.tw", () => ({ colors: { gray7: { accent: "gray7" } } }));

import useFollowListHeader from "./FollowListHeader";

type TestElement = ReactElement<{
  accessibilityLabel?: string;
  className?: string;
  children?: ReactNode;
  colorClassName?: string;
  name?: string;
  onPress?: () => void;
}>;

function children(element: TestElement): TestElement[] {
  return React.Children.toArray(element.props.children) as unknown as TestElement[];
}

/** headerRight 只返回元素，真正的按钮组件在元素内部，这里把它渲染出来 */
function headerRightTree(): TestElement {
  const headerRight = mocks.options?.headerRight as (() => TestElement) | undefined;
  const element = headerRight!();
  const Component = element.type as (props: unknown) => TestElement;
  return Component(element.props);
}

beforeEach(() => {
  mocks.options = undefined;
  mocks.navigate.mockClear();
});

test("关注页头部设置标题，并把搜索按钮放在右侧", () => {
  useFollowListHeader({ title: "关注的UP" });

  expect(mocks.options?.headerTitle).toBe("关注的UP");
  expect(mocks.options?.headerSearchBarOptions).toBeUndefined();

  const headerRight = mocks.options?.headerRight as (() => TestElement) | undefined;
  expect(headerRight).toBeTypeOf("function");
  // 导航库会直接调用 headerRight，它必须只返回元素，不能自己调用 hook
  const element = headerRight!();
  expect(React.isValidElement(element)).toBe(true);
  expect(element.type).toBeTypeOf("function");

  const container = headerRightTree();
  expect(container.props.className).toBe("mr-2");

  const [button] = children(container);
  expect(button.type).toBe("Button");
  expect(button.props.accessibilityLabel).toBe("搜索UP主");

  const [icon] = children(button);
  expect(icon.type).toBe("Icon");
  expect(icon.props.name).toBe("search");
  expect(icon.props.colorClassName).toBe("gray7");
});

test("点击头部搜索按钮进入 UP 搜索路由", () => {
  useFollowListHeader({ title: "关注的UP" });

  const [button] = children(headerRightTree());
  button.props.onPress?.();

  expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("SearchUps");
});
