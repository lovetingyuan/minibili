import React from "react";
import type { ReactElement } from "react";
import { expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useResolvedColor: vi.fn<(className: string) => string | undefined>(),
}));

vi.mock("react-native", () => ({
  Pressable: "Pressable",
  View: "View",
}));
vi.mock("lucide-react-native", () => ({
  Check: "Check",
}));
vi.mock("@/components/styled/rneui", () => ({
  Text: "Text",
}));
vi.mock("@/constants/colors.tw", () => ({
  colors: {
    gray4: { text: "text-gray-400 dark:text-gray-600" },
    primary: { accent: "accent-sky-600 dark:accent-sky-500" },
  },
}));
vi.mock("@/hooks/useResolvedColor", () => ({
  default: mocks.useResolvedColor,
}));

import { CheckBox } from "./check-box";

type ElementProps = {
  accessibilityRole?: string;
  accessibilityState?: { checked?: boolean; disabled?: boolean };
  children?: React.ReactNode;
  className?: string;
  color?: string;
  onPress?: () => void;
  style?: { backgroundColor?: string; borderColor?: string; height?: number; width?: number };
};

type TestElement = ReactElement<ElementProps>;

function childrenOf(element: TestElement) {
  return React.Children.toArray(element.props.children).filter(
    React.isValidElement,
  ) as TestElement[];
}

mocks.useResolvedColor.mockImplementation((className) =>
  className === "accent-sky-600 dark:accent-sky-500" ? "#0ea5e9" : undefined,
);

test("选中时用主题色填充方块并显示白色对勾", () => {
  const pressable = CheckBox({
    checked: true,
    title: "特别关注（1）",
    checkedColorClassName: "accent-sky-600 dark:accent-sky-500",
  }) as TestElement;
  const [wrapper] = childrenOf(pressable);
  const [box, label] = childrenOf(wrapper);
  const [icon] = childrenOf(box);

  expect(pressable.type).toBe("Pressable");
  expect(pressable.props.accessibilityRole).toBe("checkbox");
  expect(pressable.props.accessibilityState).toEqual({ checked: true, disabled: false });
  expect(box.props.style).toMatchObject({
    backgroundColor: "#0ea5e9",
    borderColor: "#0ea5e9",
    height: 20,
    width: 20,
  });
  expect(icon.type).toBe("Check");
  expect(icon.props.color).toBe("#ffffff");
  expect(label.type).toBe("Text");
  expect(label.props.children).toBe("特别关注（1）");
});

test("未选中时只画边框，不显示对勾，并支持自定义尺寸", () => {
  const pressable = CheckBox({
    checked: false,
    checkedColorClassName: "accent-sky-600 dark:accent-sky-500",
    uncheckedColor: "white",
    size: 18,
  }) as TestElement;
  const [wrapper] = childrenOf(pressable);
  const [box] = childrenOf(wrapper);

  expect(box.props.style).toMatchObject({
    backgroundColor: "transparent",
    borderColor: "white",
    height: 18,
    width: 18,
  });
  expect(childrenOf(box)).toHaveLength(0);
});

test("未选中且未指定颜色时回落到默认边框色", () => {
  CheckBox({ checked: false });

  expect(mocks.useResolvedColor).toHaveBeenCalledWith("text-gray-400 dark:text-gray-600");
});

test("ReactNode 标题原样渲染，点击交给外层 Pressable", () => {
  const onPress = vi.fn();
  const label = <React.Fragment>自定义标题</React.Fragment>;
  const pressable = CheckBox({ checked: false, title: label, onPress }) as TestElement;
  const [wrapper] = childrenOf(pressable);
  const [, title] = childrenOf(wrapper);

  expect(title.type).toBe(React.Fragment);
  expect(title.props.children).toBe("自定义标题");
  pressable.props.onPress?.();
  expect(onPress).toHaveBeenCalledTimes(1);
});
