import React from "react";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  onClose: vi.fn(),
  onPress: vi.fn(),
  platform: { OS: "android" },
}));

vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  KeyboardAvoidingView: "KeyboardAvoidingView",
  Modal: "Modal",
  Platform: mocks.platform,
  Pressable: "Pressable",
  View: "View",
}));
vi.mock("@/components/styled/rneui", () => ({ Button: "Button", Text: "Text" }));
vi.mock("@/constants/colors.tw", () => import("../../constants/colors.tw"));
vi.mock("@/hooks/useResolvedColor", () => ({ default: () => "#0ea5e9" }));

import { Dialog } from "./Dialog";

type DialogTestProps = ComponentProps<typeof Dialog>;

type ElementProps = {
  accessibilityLabel?: string;
  accessibilityRole?: string;
  animationType?: string;
  behavior?: string;
  children?: ReactNode;
  className?: string;
  color?: string;
  containerStyle?: { width?: string };
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  onRequestClose?: () => void;
  pointerEvents?: string;
  size?: string;
  statusBarTranslucent?: boolean;
  title?: string;
  titleStyle?: { fontSize?: number; fontWeight?: string };
  transparent?: boolean;
  type?: string;
  visible?: boolean;
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

function render(props: DialogTestProps) {
  return elements(Dialog(props));
}

function modalOf(rendered: ReactElement<ElementProps>[]) {
  return rendered[0];
}

function backdropOf(rendered: ReactElement<ElementProps>[]) {
  return rendered.find((element) => element.props.className?.startsWith("absolute inset-0"))!;
}

function panelOf(rendered: ReactElement<ElementProps>[]) {
  return rendered.find((element) => element.props.className?.includes("w-[90%]"))!;
}

function keyboardAvoiderOf(rendered: ReactElement<ElementProps>[]) {
  return rendered.find((element) => element.props.pointerEvents === "box-none")!;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.platform.OS = "android";
});

test("用透明且覆盖状态栏的原生 Modal 渲染，默认淡入", () => {
  const modal = modalOf(render({ children: null, visible: true }));

  expect(modal.type).toBe("Modal");
  expect(modal.props.visible).toBe(true);
  expect(modal.props.transparent).toBe(true);
  expect(modal.props.statusBarTranslucent).toBe(true);
  expect(modal.props.animationType).toBe("fade");
});

test("允许覆盖弹出动画", () => {
  const modal = modalOf(render({ animationType: "none", children: null, visible: true }));

  expect(modal.props.animationType).toBe("none");
});

test("点击遮罩关闭弹窗", () => {
  const rendered = render({ children: null, onClose: mocks.onClose, visible: true });
  const backdrop = backdropOf(rendered);

  expect(backdrop.props.className).toBe("absolute inset-0 bg-black/40");
  expect(backdrop.props.accessibilityRole).toBe("button");
  expect(backdrop.props.accessibilityLabel).toBe("关闭弹窗");
  backdrop.props.onPress?.();

  expect(mocks.onClose).toHaveBeenCalledOnce();
});

test("键盘避让由弹窗统一处理：iOS 加内边距，Android 交给系统", () => {
  const androidAvoider = keyboardAvoiderOf(render({ children: null, visible: true }));
  expect(androidAvoider.type).toBe("KeyboardAvoidingView");
  expect(androidAvoider.props.behavior).toBeUndefined();

  mocks.platform.OS = "ios";
  const iosAvoider = keyboardAvoiderOf(render({ children: null, visible: true }));
  expect(iosAvoider.props.behavior).toBe("padding");
});

test("onClose 缺省时弹窗不可关闭，返回键被吞掉", () => {
  const rendered = render({ children: null, visible: true });
  const modal = modalOf(rendered);
  const backdrop = backdropOf(rendered);

  expect(backdrop.props.onPress).toBeUndefined();
  expect(backdrop.props.accessibilityRole).toBeUndefined();
  // 始终注册返回键回调：没有 onClose 时也不把返回键漏给导航层
  expect(modal.props.onRequestClose).toBeInstanceOf(Function);
  modal.props.onRequestClose?.();

  expect(mocks.onClose).not.toHaveBeenCalled();
});

test("返回键收口到 onClose，且不受 dismissOnBackdrop 影响", () => {
  const modal = modalOf(
    render({ children: null, dismissOnBackdrop: false, onClose: mocks.onClose, visible: true }),
  );

  modal.props.onRequestClose?.();

  expect(mocks.onClose).toHaveBeenCalledOnce();
});

test("dismissOnBackdrop=false 时点击遮罩不关闭", () => {
  const backdrop = backdropOf(
    render({ children: null, dismissOnBackdrop: false, onClose: mocks.onClose, visible: true }),
  );

  expect(backdrop.props.onPress).toBeUndefined();
});

test("面板默认样式与自定义样式按顺序合并", () => {
  const defaultPanel = panelOf(render({ children: null, visible: true }));
  const defaultClassName = defaultPanel.props.className ?? "";
  for (const token of [
    "w-[90%]",
    "max-w-lg",
    "rounded-xl",
    "p-5",
    "bg-white",
    "dark:bg-neutral-900",
  ]) {
    expect(defaultClassName).toContain(token);
  }

  const customClassName =
    panelOf(render({ children: null, className: "w-[70%] max-w-xs", visible: true })).props
      .className ?? "";
  expect(customClassName).toContain("w-[70%] max-w-xs");
  // 自定义类名必须排在默认类名之后，uniwind 解析时后者才会覆盖前者
  expect(customClassName.indexOf("w-[70%]")).toBeGreaterThan(customClassName.indexOf("w-[90%]"));
  expect(customClassName.indexOf("max-w-xs")).toBeGreaterThan(customClassName.indexOf("max-w-lg"));
});

test("允许覆盖遮罩样式", () => {
  const backdrop = backdropOf(
    render({ backdropClassName: "bg-black/70", children: null, visible: true }),
  );

  expect(backdrop.props.className).toBe("absolute inset-0 bg-black/70");
});

test("标题使用对话框标题的字号与下边距", () => {
  const title = Dialog.Title({ title: "设置分组" });
  const className = title.props.className ?? "";

  expect(title.props.children).toBe("设置分组");
  expect(className).toContain("text-lg");
  expect(className).toContain("font-semibold");
  expect(className).toContain("mb-2.5");
});

test("按钮固定 clear 样式并透传交互属性", () => {
  const button = Dialog.Button({
    disabled: true,
    loading: true,
    onPress: mocks.onPress,
    title: "确定",
  });

  expect(button.type).toBe("Button");
  expect(button.props.title).toBe("确定");
  expect(button.props.type).toBe("clear");
  expect(button.props.loading).toBe(true);
  expect(button.props.disabled).toBe(true);
  expect(button.props.containerStyle).toEqual({ width: "auto" });
  expect(button.props.titleStyle).toEqual({ fontSize: 15, fontWeight: "500" });

  button.props.onPress?.();
  expect(mocks.onPress).toHaveBeenCalledOnce();
});

test("操作区反序排列，加载指示器用主题色", () => {
  const actions = Dialog.Actions({ children: null });
  const actionsClassName = actions.props.className ?? "";
  expect(actionsClassName).toContain("mt-2.5");
  expect(actionsClassName).toContain("flex-row-reverse");

  const loading = elements(Dialog.Loading({})).find(
    (element) => element.type === "ActivityIndicator",
  )!;
  expect(loading.props.color).toBe("#0ea5e9");
  expect(loading.props.size).toBe("large");
});
