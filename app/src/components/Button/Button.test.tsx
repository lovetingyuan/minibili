import { Children, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  platform: "ios" as "android" | "ios",
  useResolvedColor: vi.fn<(className?: string) => string | undefined>(),
  useResolvedStyle: vi.fn<(className?: string) => Record<string, unknown>>(),
}));

vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  Platform: {
    get OS() {
      return mocks.platform;
    },
    select: (options: Record<string, unknown>) => options,
  },
  Pressable: "Pressable",
  StyleSheet: {
    create: (styles: Record<string, unknown>) => styles,
    hairlineWidth: 1,
  },
  Text: "Text",
  View: "View",
}));
vi.mock("@/constants/theme", () => ({
  theme: {
    background: {
      fillDisabled: { accent: "accent-slate-300 dark:accent-slate-700" },
      fillMuted: { accent: "accent-slate-400 dark:accent-slate-600" },
    },
    text: { disabled: "text-slate-500" },
    primary: { text: "text-[#008AC5] dark:text-[#00AEEC]" },
  },
}));
vi.mock("@/hooks/useResolvedColor", () => ({ default: mocks.useResolvedColor }));
vi.mock("@/hooks/useResolvedStyle", () => ({ default: mocks.useResolvedStyle }));
// vitest 下没有 `@/` 别名，真实实现要通过相对路径引入
vi.mock("@/utils/color", () => import("../../utils/color"));

import { Button } from "./Button";

const PRIMARY = "#008AC5";
const DISABLED_BACKGROUND = "#d4d4d4";
const DISABLED_BORDER = "#a3a3a3";
const DISABLED_TITLE = "#737373";

type PressableStyle =
  | StyleProp<ViewStyle>
  | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);

type ElementProps = {
  accessibilityLabel?: string;
  accessibilityRole?: string;
  accessibilityState?: { busy?: boolean; disabled?: boolean };
  android_ripple?: { borderless?: boolean; color?: string; foreground?: boolean } | null;
  children?: ReactNode;
  color?: string;
  disabled?: boolean;
  onPress?: () => void;
  style?: PressableStyle;
  testID?: string;
  type?: unknown;
};

type StyleObject = Record<string, unknown>;

function mergeStyles(style: unknown): StyleObject {
  if (!style) {
    return {};
  }
  if (Array.isArray(style)) {
    return style.reduce<StyleObject>((acc, item) => ({ ...acc, ...mergeStyles(item) }), {});
  }
  if (typeof style === "object") {
    return Object.fromEntries(Object.entries(style));
  }
  return {};
}

function elements(node: ReactNode): ReactElement<ElementProps>[] {
  const result: ReactElement<ElementProps>[] = [];
  Children.forEach(node, (child) => {
    if (isValidElement<ElementProps>(child)) {
      result.push(child, ...elements(child.props.children));
    }
  });
  return result;
}

function styleOf(element: ReactElement<ElementProps>, pressed = false): StyleObject {
  const style = element.props.style;
  return mergeStyles(typeof style === "function" ? style({ pressed }) : style);
}

function render(props: Parameters<typeof Button>[0]) {
  const rendered = elements(Button(props));
  const wrapper = rendered.find((element) => element.props.testID === "RNE_BUTTON_WRAPPER")!;
  const pressable = rendered.find((element) => element.props.testID === "RNE_BUTTON_PRESSABLE")!;
  const title = rendered.find((element) => element.type === "Text");
  const loading = rendered.find((element) => element.type === "ActivityIndicator");
  return { loading, pressable, rendered, title, wrapper };
}

beforeEach(() => {
  mocks.platform = "ios";
  mocks.useResolvedColor.mockReset();
  mocks.useResolvedStyle.mockReset();
  mocks.useResolvedColor.mockImplementation((className) => {
    if (className === "text-[#008AC5] dark:text-[#00AEEC]") {
      return PRIMARY;
    }
    if (className === "accent-slate-300 dark:accent-slate-700") {
      return DISABLED_BACKGROUND;
    }
    if (className === "accent-slate-400 dark:accent-slate-600") {
      return DISABLED_BORDER;
    }
    if (className === "text-slate-500") {
      return DISABLED_TITLE;
    }
    return undefined;
  });
  mocks.useResolvedStyle.mockReturnValue({});
});

test("默认 solid + md + xs 时沿用 RNE 的主色与 spacing", () => {
  const { pressable, title, wrapper } = render({ title: "确定" });

  expect(styleOf(wrapper)).toMatchObject({ borderRadius: 2, overflow: "hidden" });
  expect(styleOf(pressable)).toMatchObject({
    backgroundColor: PRIMARY,
    borderRadius: 2,
    borderWidth: 0,
    padding: 8,
    paddingHorizontal: 10,
  });
  expect(title?.props.children).toBe("确定");
  expect(mergeStyles(title?.props.style)).toMatchObject({
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
  });
  expect(mocks.useResolvedColor).toHaveBeenCalledWith("text-[#008AC5] dark:text-[#00AEEC]");
});

test("children 优先于 title", () => {
  const { title } = render({ children: "子节点", title: "标题" });

  expect(title?.props.children).toBe("子节点");
});

test("clear 与 outline 使用透明底与主色文字", () => {
  const clear = render({ title: "清空", type: "clear" });
  expect(styleOf(clear.pressable)).toMatchObject({
    backgroundColor: "transparent",
    borderWidth: 0,
  });
  expect(mergeStyles(clear.title?.props.style)).toMatchObject({ color: PRIMARY });

  const outline = render({ title: "重试", type: "outline" });
  expect(styleOf(outline.pressable)).toMatchObject({
    backgroundColor: "transparent",
    borderColor: PRIMARY,
    borderWidth: 1,
  });
  expect(mergeStyles(outline.title?.props.style)).toMatchObject({ color: PRIMARY });
});

test("size 与 radius 影响内边距和圆角", () => {
  const small = render({ size: "sm", title: "小" });
  expect(styleOf(small.pressable)).toMatchObject({ padding: 4, paddingHorizontal: 6 });

  const large = render({ radius: "lg", size: "lg", title: "大" });
  expect(styleOf(large.pressable)).toMatchObject({
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
  });

  const custom = render({ radius: 7, title: "自定义圆角" });
  expect(styleOf(custom.pressable)).toMatchObject({ borderRadius: 7 });
});

test("disabled 时用灰色底与灰色文字且不触发 onPress", () => {
  const onPress = vi.fn();
  const { pressable, title } = render({ disabled: true, onPress, title: "关注" });

  pressable.props.onPress?.();

  expect(onPress).not.toHaveBeenCalled();
  expect(styleOf(pressable)).toMatchObject({
    backgroundColor: DISABLED_BACKGROUND,
    borderColor: DISABLED_BORDER,
  });
  expect(mergeStyles(title?.props.style)).toMatchObject({ color: DISABLED_TITLE });
  expect(pressable.props.accessibilityState).toMatchObject({ busy: false, disabled: true });
});

test("loading 时显示指示器、隐藏标题且不触发 onPress", () => {
  const onPress = vi.fn();
  const { loading, pressable, title } = render({ loading: true, onPress, title: "提交" });

  pressable.props.onPress?.();

  expect(title).toBeUndefined();
  expect(loading?.props.color).toBe("#ffffff");
  expect(onPress).not.toHaveBeenCalled();
  expect(pressable.props.accessibilityState).toMatchObject({ busy: true, disabled: false });
});

test("非 solid 按钮的 loading 指示器用主色", () => {
  const { loading } = render({ loading: true, title: "重试", type: "clear" });

  expect(loading?.props.color).toBe(PRIMARY);
});

test("Android 未禁用时使用标题色 32% 透明度的水波纹", () => {
  mocks.platform = "android";

  const solid = render({ title: "确定" });
  expect(solid.pressable.props.android_ripple).toMatchObject({
    borderless: false,
    color: "rgba(255, 255, 255, 0.32)",
    foreground: true,
  });

  const clear = render({ title: "重试", type: "clear" });
  expect(clear.pressable.props.android_ripple).toMatchObject({ color: "rgba(0, 138, 197, 0.32)" });

  const disabled = render({ disabled: true, title: "关注" });
  expect(disabled.pressable.props.android_ripple).toBeNull();
});

test("iOS 与其它平台没有水波纹，改用按下透明度", () => {
  const { pressable } = render({ title: "确定" });

  expect(pressable.props.android_ripple).toBeNull();
  expect(styleOf(pressable)).not.toHaveProperty("opacity");
  expect(styleOf(pressable, true)).toMatchObject({ opacity: 0.3 });
});

test("Android 有水波纹时不再叠加按下透明度", () => {
  mocks.platform = "android";

  const { pressable } = render({ title: "确定" });

  expect(styleOf(pressable, true)).not.toHaveProperty("opacity");
});

test("className 排在运行时样式之后，可以覆盖默认排版", () => {
  mocks.useResolvedStyle.mockImplementation((className) => {
    if (className === "px-5 py-2.5") {
      return { padding: 20, paddingHorizontal: 20 };
    }
    if (className === "mx-5 rounded-lg") {
      return { marginHorizontal: 20, borderRadius: 8 };
    }
    if (className === "w-full text-left") {
      return { color: "#111111", textAlign: "left", width: "100%" };
    }
    return {};
  });

  const { pressable, title, wrapper } = render({
    buttonClassName: "px-5 py-2.5",
    containerClassName: "mx-5 rounded-lg",
    title: "收藏",
    titleClassName: "w-full text-left",
    type: "clear",
  });

  expect(styleOf(pressable)).toMatchObject({ padding: 20, paddingHorizontal: 20 });
  expect(styleOf(wrapper)).toMatchObject({ borderRadius: 8, marginHorizontal: 20 });
  expect(mergeStyles(title?.props.style)).toMatchObject({ color: "#111111", textAlign: "left" });
  expect(mocks.useResolvedStyle).toHaveBeenCalledWith("px-5 py-2.5");
  expect(mocks.useResolvedStyle).toHaveBeenCalledWith("mx-5 rounded-lg");
  expect(mocks.useResolvedStyle).toHaveBeenCalledWith("w-full text-left");
});

test("透传 Pressable 的其余 props", () => {
  const { pressable } = render({ accessibilityLabel: "搜索视频", testID: "custom", title: "搜索" });

  expect(pressable.props.accessibilityLabel).toBe("搜索视频");
  expect(pressable.props.testID).toBe("RNE_BUTTON_PRESSABLE");
  expect(pressable.props.disabled).toBe(false);
});

test("显式传入的无障碍角色会覆盖默认按钮语义", () => {
  const { pressable } = render({ accessibilityRole: "text", title: "静态标签" });

  expect(pressable.props.accessibilityRole).toBe("text");
});

test("style 作用在按压区域，且仍能被 buttonClassName 覆盖", () => {
  mocks.useResolvedStyle.mockImplementation((className) =>
    className === "h-8" ? { height: 32 } : {},
  );

  const { pressable } = render({ buttonClassName: "h-8", style: { marginLeft: 5 }, title: "退出" });

  expect(styleOf(pressable)).toMatchObject({ height: 32, marginLeft: 5 });
});
