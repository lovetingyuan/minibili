import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

type OverlayButton = { text: string; onPress: () => void };

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
  title?: string;
  accessibilityLabel?: string;
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

  const button = render().find((element) => element.props.title === "收藏")!;
  button.props.onPress?.();

  expect(calls).toEqual(["dismiss", "action"]);
  expect(mocks.setOverlayButtons).toHaveBeenCalledWith([]);
});
