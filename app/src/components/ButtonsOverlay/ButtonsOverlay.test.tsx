import type { LucideIcon } from "lucide-react-native";
import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import { theme } from "../../constants/theme";

// vitest 下没有 `@/` 别名，真实实现要通过相对路径引入
const TestIcon = "TestIcon" as unknown as LucideIcon;

type OverlayButton = {
  text: string;
  onPress: () => void;
  icon?: LucideIcon;
  filled?: boolean;
};

const mocks = vi.hoisted(() => ({
  overlayButtons: [] as OverlayButton[],
  setOverlayButtons: vi.fn<(buttons: OverlayButton[]) => void>(),
}));

vi.mock("react-native", () => ({
  Modal: "Modal",
  Pressable: "Pressable",
  View: "View",
}));
vi.mock("@/components/styled/rneui", () => ({ Button: "Button" }));
vi.mock("@/components/ThemedIcon", () => ({ ThemedIcon: "ThemedIcon" }));
vi.mock("@/constants/theme", () => import("../../constants/theme"));
vi.mock("@/store", () => ({
  useStore: () => ({
    overlayButtons: mocks.overlayButtons,
    setOverlayButtons: mocks.setOverlayButtons,
  }),
}));

import ButtonsOverlay from "./ButtonsOverlay";

type ElementProps = {
  children?: ReactNode;
  visible?: boolean;
  transparent?: boolean;
  animationType?: string;
  statusBarTranslucent?: boolean;
  onRequestClose?: () => void;
  onPress?: () => void;
  className?: string;
  accessibilityLabel?: string;
  colorClassName?: string;
  filled?: boolean;
  icon?: LucideIcon;
  size?: number;
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

function render() {
  return elements(ButtonsOverlay());
}

/** 按文案找到菜单项按钮（文案现在作为 children 传入） */
function menuItem(text: string) {
  const button = render().find(
    (element) =>
      element.type === "Button" && React.Children.toArray(element.props.children).includes(text),
  );
  expect(button).toBeDefined();
  return button!;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.overlayButtons = [];
});

test("按钮列表为空时不渲染", () => {
  expect(ButtonsOverlay()).toBeNull();
});

test("使用透明且无动画的原生 Modal", () => {
  mocks.overlayButtons = [{ text: "收藏", onPress: vi.fn() }];

  const modal = render().find((element) => element.props.animationType === "none")!;
  expect(modal.props.visible).toBe(true);
  expect(modal.props.transparent).toBe(true);
  expect(modal.props.statusBarTranslucent).toBe(true);

  modal.props.onRequestClose?.();
  expect(mocks.setOverlayButtons).toHaveBeenCalledWith([]);
});

test("点击遮罩关闭菜单并保留菜单容器样式", () => {
  mocks.overlayButtons = [{ text: "收藏", onPress: vi.fn() }];

  const rendered = render();
  const backdrop = rendered.find((element) => element.props.accessibilityLabel === "关闭菜单")!;
  const menu = rendered.find((element) => element.props.className?.includes("max-w-[500px]"))!;

  expect(backdrop.props.className).toBe("absolute inset-0 bg-black/40");
  backdrop.props.onPress?.();
  expect(mocks.setOverlayButtons).toHaveBeenCalledWith([]);

  expect(menu.props.className).toContain("w-[80%]");
  expect(menu.props.className).toContain("overflow-hidden rounded-lg");
  expect(menu.props.className).toContain("px-0 py-3 shadow-sm");
  expect(menu.props.className).toContain("bg-slate-200 dark:bg-slate-800");
});

test("点击菜单项时先关闭菜单再执行业务回调", () => {
  const calls: string[] = [];
  mocks.setOverlayButtons.mockImplementation(() => calls.push("dismiss"));
  mocks.overlayButtons = [
    {
      text: "收藏",
      onPress: () => calls.push("action"),
    },
  ];

  menuItem("收藏").props.onPress?.();

  expect(calls).toEqual(["dismiss", "action"]);
  expect(mocks.setOverlayButtons).toHaveBeenCalledWith([]);
});

test("图标排在文案之前，并按按钮配置渲染", () => {
  mocks.overlayButtons = [{ text: "收藏", onPress: vi.fn(), icon: TestIcon, filled: true }];

  const children = React.Children.toArray(menuItem("收藏").props.children);
  const [icon, text] = children as [ReactElement<ElementProps>, string];

  expect(children).toHaveLength(2);
  expect(icon.type).toBe("ThemedIcon");
  expect(icon.props.icon).toBe(TestIcon);
  expect(icon.props.filled).toBe(true);
  expect(icon.props.size).toBe(18);
  expect(icon.props.colorClassName).toBe(theme.primary.accent);
  expect(text).toBe("收藏");
});

test("未配置图标的按钮只渲染文案", () => {
  mocks.overlayButtons = [{ text: "收藏", onPress: vi.fn() }];

  expect(React.Children.toArray(menuItem("收藏").props.children)).toEqual(["收藏"]);
});
