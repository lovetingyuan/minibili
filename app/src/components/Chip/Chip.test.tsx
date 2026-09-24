import React from "react";
import type { ReactElement } from "react";
import { View } from "react-native";
import { expect, test, vi } from "vitest";

vi.mock("@/components/Button", () => ({ Button: "Button" }));
vi.mock("react-native", () => ({
  Text: "Text",
  View: "View",
}));

import { Chip } from "./Chip";

type ElementProps = {
  accessibilityRole?: string;
  buttonClassName?: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onPress?: () => void;
  radius?: number;
  testID?: string;
  type?: string;
};

type TestElement = ReactElement<ElementProps>;

function children(element: TestElement) {
  return React.Children.toArray(element.props.children).filter(
    React.isValidElement,
  ) as TestElement[];
}

test("使用本地 Button，并沿用 RNE 的圆角和标题字号", () => {
  const chip = Chip({ title: "动画", type: "outline" }) as TestElement;
  const [title] = children(chip);

  expect(chip.type).toBe("Button");
  expect(chip.props.radius).toBe(30);
  expect(chip.props.type).toBe("outline");
  expect(title.props.className).toContain("text-sm");
  expect(title.props.className).toContain("text-[#008AC5]");
  expect(title.props.children).toBe("动画");
});

test("可点击 Chip 把交互交给本地 Button", () => {
  const onPress = vi.fn();
  const chip = Chip({ onPress, title: "番剧" }) as TestElement;

  expect(chip.props.onPress).toBe(onPress);
  expect(chip.props.buttonClassName).toContain("gap-1");
});

test("iconRight 把图标放在标题右侧", () => {
  const icon = <View testID="remove" />;
  const chip = Chip({ icon, iconRight: true, title: "移除" }) as TestElement;
  const [title, iconContainer] = children(chip);

  expect(title.type).toBe("Text");
  expect(children(iconContainer)[0].props.testID).toBe("remove");
});

test("禁用状态透传给本地 Button", () => {
  const chip = Chip({ disabled: true, onPress: vi.fn(), title: "禁用" }) as TestElement;

  expect(chip.props.disabled).toBe(true);
  expect(chip.props.buttonClassName).toContain("opacity-50");
});

test("静态 Chip 保留调用方指定的文本语义", () => {
  const chip = Chip({ accessibilityRole: "text", title: "黑名单" }) as TestElement;

  expect(chip.props.accessibilityRole).toBe("text");
});
