import React from "react";
import type { ReactElement } from "react";
import { View } from "react-native";
import { expect, test, vi } from "vitest";

vi.mock("react-native", () => ({
  Pressable: "Pressable",
  Text: "Text",
  View: "View",
}));

import { Chip } from "./Chip";

type ElementProps = {
  accessibilityRole?: string;
  accessibilityState?: { disabled?: boolean };
  children?: React.ReactNode;
  className?: string;
  testID?: string;
};

type TestElement = ReactElement<ElementProps>;

function children(element: TestElement) {
  return React.Children.toArray(element.props.children).filter(
    React.isValidElement,
  ) as TestElement[];
}

function buttonOf(chip: TestElement) {
  return children(chip)[0];
}

test("outline Chip 使用主题描边与文字色", () => {
  const chip = Chip({ title: "动画", type: "outline" }) as TestElement;
  const button = buttonOf(chip);
  const [title] = children(button);

  expect(button.props.className).toContain("border-sky-500");
  expect(title.props.className).toContain("text-sky-600");
  expect(title.props.children).toBe("动画");
});

test("可点击 Chip 提供按钮语义和按压反馈", () => {
  const chip = Chip({ onPress: vi.fn(), title: "番剧" }) as TestElement;
  const button = buttonOf(chip);

  expect(button.props.accessibilityRole).toBe("button");
  expect(button.props.className).toContain("active:opacity-70");
});

test("iconRight 把图标放在标题右侧", () => {
  const icon = <View testID="remove" />;
  const chip = Chip({ icon, iconRight: true, title: "移除" }) as TestElement;
  const [title, iconContainer] = children(buttonOf(chip));

  expect(title.type).toBe("Text");
  expect(children(iconContainer)[0].props.testID).toBe("remove");
});

test("禁用状态同步到交互与无障碍状态", () => {
  const chip = Chip({ disabled: true, onPress: vi.fn(), title: "禁用" }) as TestElement;
  const button = buttonOf(chip);

  expect(button.props.accessibilityState).toEqual({ disabled: true });
  expect(button.props.className).toContain("opacity-50");
});
