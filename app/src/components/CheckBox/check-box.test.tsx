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
  Square: "Square",
  SquareCheck: "SquareCheck",
}));
vi.mock("@/components/styled/rneui", () => ({
  Text: "Text",
}));
vi.mock("@/constants/theme", () => ({
  theme: {
    background: { surface: "bg-white dark:bg-slate-950" },
    icon: { placeholder: "accent-slate-400 dark:accent-slate-600" },
    primary: { accent: "accent-[#008AC5] dark:accent-[#00AEEC]" },
    text: {
      disabled: "text-slate-500",
      secondary: "text-slate-700 dark:text-slate-300",
    },
  },
}));
vi.mock("@/hooks/useResolvedColor", () => ({
  default: mocks.useResolvedColor,
}));

import { CheckBox } from "./check-box";
import { CheckBoxIcon } from "./check-box-icon";
import type { CheckBoxIconProps } from "./check-box.types";

type ElementProps = {
  accessibilityRole?: string;
  accessibilityState?: { checked?: boolean; disabled?: boolean };
  children?: React.ReactNode;
  className?: string;
  color?: string;
  onPress?: () => void;
  size?: number;
  style?: unknown;
  testID?: string;
};

type TestElement = ReactElement<ElementProps>;

function childrenOf(element: TestElement) {
  return React.Children.toArray(element.props.children).filter(
    React.isValidElement,
  ) as TestElement[];
}

mocks.useResolvedColor.mockImplementation((className) =>
  className === "accent-[#008AC5] dark:accent-[#00AEEC]" ? "#008AC5" : undefined,
);

test("选中时使用 RNE 容器语义并显示主题色图标", () => {
  const pressable = CheckBox({
    checked: true,
    title: "特别关注（1）",
    checkedColorClassName: "accent-[#008AC5] dark:accent-[#00AEEC]",
  }) as TestElement;
  const [wrapper] = childrenOf(pressable);
  const [icon, label] = childrenOf(wrapper);
  const renderedIcon = CheckBoxIcon(icon.props as CheckBoxIconProps) as TestElement;

  expect(pressable.type).toBe("Pressable");
  expect(pressable.props.testID).toBe("RNE__CheckBox__Wrapper");
  expect(pressable.props.accessibilityRole).toBe("checkbox");
  expect(pressable.props.accessibilityState).toEqual({ checked: true, disabled: false });
  expect(icon.type).toBe(CheckBoxIcon);
  expect(renderedIcon.type).toBe("SquareCheck");
  expect(renderedIcon.props.color).toBe("#008AC5");
  expect(renderedIcon.props.size).toBe(24);
  expect(label.type).toBe("Text");
  expect(label.props.children).toBe("特别关注（1）");
});

test("未选中时显示空方框，并支持自定义尺寸", () => {
  const pressable = CheckBox({
    checked: false,
    checkedColorClassName: "accent-[#008AC5] dark:accent-[#00AEEC]",
    uncheckedColor: "white",
    size: 18,
  }) as TestElement;
  const [wrapper] = childrenOf(pressable);
  const [icon] = childrenOf(wrapper);
  const renderedIcon = CheckBoxIcon(icon.props as CheckBoxIconProps) as TestElement;

  expect(renderedIcon.type).toBe("Square");
  expect(renderedIcon.props.color).toBe("white");
  expect(renderedIcon.props.size).toBe(18);
});

test("未选中且未指定颜色时回落到默认边框色", () => {
  CheckBox({ checked: false });

  expect(mocks.useResolvedColor).toHaveBeenCalledWith("accent-slate-400 dark:accent-slate-600");
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

test("支持 RNE 的 checkedTitle、iconRight 和自定义图标", () => {
  const customIcon = <React.Fragment>已选择</React.Fragment>;
  const pressable = CheckBox({
    checked: true,
    checkedIcon: customIcon,
    checkedTitle: "已关注",
    iconRight: true,
    title: "关注",
  }) as TestElement;
  const [wrapper] = childrenOf(pressable);
  const [label, icon] = childrenOf(wrapper);

  expect(label.props.children).toBe("已关注");
  expect(icon.type).toBe(CheckBoxIcon);
  expect(CheckBoxIcon(icon.props as CheckBoxIconProps)).toBe(customIcon);
});
