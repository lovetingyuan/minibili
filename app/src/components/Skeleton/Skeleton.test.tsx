import { Children, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  interpolate: vi.fn<(config: unknown) => { interpolation: unknown }>(),
  loop: vi.fn<(animation: unknown) => void>(),
  setValue: vi.fn<(value: number) => void>(),
  start: vi.fn(),
  timing: vi.fn<(value: unknown, config: unknown) => void>(),
  useResolvedColor: vi.fn<(className?: string) => string | undefined>(),
  useResolvedStyle: vi.fn<(className?: string) => Record<string, unknown>>(),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useEffect: (effect: () => void) => {
      effect();
    },
    useRef: (value: unknown) => ({ current: value }),
    useState: (value: unknown) => [value, () => undefined],
  };
});
vi.mock("react-native", () => {
  class AnimatedValue {
    interpolate(config: unknown) {
      return mocks.interpolate(config);
    }

    setValue(value: number) {
      mocks.setValue(value);
    }
  }

  return {
    Animated: {
      Value: AnimatedValue,
      View: "AnimatedView",
      loop: (animation: unknown) => {
        mocks.loop(animation);
        return { start: mocks.start };
      },
      timing: (value: unknown, config: unknown) => {
        mocks.timing(value, config);
        return { animation: "timing" };
      },
    },
    Platform: { OS: "ios", select: (options: Record<string, unknown>) => options },
    StyleSheet: { create: (styles: Record<string, unknown>) => styles },
    View: "View",
  };
});
vi.mock("@/constants/theme", () => ({
  theme: {
    slate: {
      2: { accent: "accent-slate-200 dark:accent-slate-800" },
      3: { accent: "accent-slate-300 dark:accent-slate-700" },
    },
  },
}));
vi.mock("@/hooks/useResolvedColor", () => ({ default: mocks.useResolvedColor }));
vi.mock("@/hooks/useResolvedStyle", () => ({ default: mocks.useResolvedStyle }));

import { Skeleton } from "./Skeleton";

const BASE = "#d4d4d4";
const HIGHLIGHT = "#a3a3a3";

type ElementProps = {
  accessibilityLabel?: string;
  children?: ReactNode;
  onLayout?: (event: { nativeEvent: { layout: { width: number } } }) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

type StyleObject = Record<string, unknown>;

function mergeStyles(value: unknown): StyleObject {
  if (!value) {
    return {};
  }
  if (Array.isArray(value)) {
    return value.reduce<StyleObject>((acc, item) => ({ ...acc, ...mergeStyles(item) }), {});
  }
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value));
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

function render(props: Parameters<typeof Skeleton>[0]) {
  const rendered = elements(Skeleton(props));
  const wrapper = rendered.find((element) => element.props.testID === "RNE__Skeleton")!;
  const highlight = rendered.find((element) => element.type === "AnimatedView");
  return { highlight, rendered, wrapper };
}

beforeEach(() => {
  mocks.interpolate.mockReset();
  mocks.loop.mockReset();
  mocks.setValue.mockReset();
  mocks.start.mockReset();
  mocks.timing.mockReset();
  mocks.useResolvedColor.mockReset();
  mocks.useResolvedStyle.mockReset();
  mocks.interpolate.mockImplementation((config) => ({ interpolation: config }));
  mocks.useResolvedColor.mockImplementation((className) =>
    className === "accent-slate-200 dark:accent-slate-800" ? BASE : HIGHLIGHT,
  );
  mocks.useResolvedStyle.mockReturnValue({});
});

test("默认渲染 100% x 12 的脉冲骨架，并启动循环动画", () => {
  const { highlight, wrapper } = render({});

  expect(styleOf(wrapper)).toMatchObject({
    backgroundColor: BASE,
    borderRadius: 2,
    height: 12,
    overflow: "hidden",
    width: "100%",
  });
  expect(wrapper.props.testID).toBe("RNE__Skeleton");
  expect(wrapper.props.accessibilityLabel).toBe("loading...");
  expect(styleOf(highlight)).toMatchObject({
    backgroundColor: HIGHLIGHT,
    height: "100%",
    width: "100%",
  });
  expect(styleOf(highlight).opacity).toMatchObject({
    interpolation: { inputRange: [0, 1, 2], outputRange: [1, 0, 1] },
  });
  expect(mocks.timing).toHaveBeenCalledWith(expect.anything(), {
    delay: 400,
    duration: 1500,
    toValue: 2,
    useNativeDriver: true,
  });
  expect(mocks.setValue).toHaveBeenCalledWith(0);
  expect(mocks.loop).toHaveBeenCalledTimes(1);
  expect(mocks.start).toHaveBeenCalledTimes(1);
});

test("circle 时圆角取 50，高度缺省时跟随宽度", () => {
  const { wrapper } = render({ circle: true, width: 36 });

  expect(styleOf(wrapper)).toMatchObject({ borderRadius: 50, height: 36, width: 36 });
});

test("animation=none 时不渲染高光层", () => {
  const { highlight } = render({ animation: "none" });

  expect(highlight).toBeUndefined();
});

test("animation=wave 时改用位移插值驱动高光", () => {
  const { highlight } = render({ animation: "wave" });

  expect(styleOf(highlight)).not.toHaveProperty("width");
  expect(styleOf(highlight)).toHaveProperty("transform");
  // 测试里没有真实布局，测得宽度为 0，位移范围就是 ±0
  expect(mocks.interpolate.mock.calls.at(-1)?.[0]).toEqual({
    inputRange: [0, 2],
    outputRange: [-0, 0],
  });
});

test("className 可以覆盖底色，skeletonClassName 作用于高光层", () => {
  mocks.useResolvedStyle.mockImplementation((className) => {
    if (className === "rounded-full") {
      return { backgroundColor: "#111111" };
    }
    if (className === "h-2") {
      return { height: "50%" };
    }
    return {};
  });

  const { highlight, wrapper } = render({
    className: "rounded-full",
    skeletonClassName: "h-2",
  });

  expect(styleOf(wrapper).backgroundColor).toBe("#111111");
  expect(styleOf(highlight).height).toBe("50%");
  expect(mocks.useResolvedStyle).toHaveBeenCalledWith("rounded-full");
  expect(mocks.useResolvedStyle).toHaveBeenCalledWith("h-2");
});

test("onLayout 同时更新动画宽度与调用方回调", () => {
  const onLayout = vi.fn();
  const { wrapper } = render({ animation: "wave", onLayout });

  wrapper.props.onLayout?.({ nativeEvent: { layout: { width: 120 } } });

  expect(onLayout).toHaveBeenCalledWith({ nativeEvent: { layout: { width: 120 } } });
});

function styleOf(element: ReactElement<ElementProps> | undefined): StyleObject {
  return mergeStyles(element?.props.style);
}
