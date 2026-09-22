import React from "react";
import { describe, expect, test, vi } from "vitest";

import type { ReactElement, ReactNode } from "react";

vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  KeyboardAvoidingView: "KeyboardAvoidingView",
  Platform: { OS: "android" },
  Pressable: "Pressable",
  TextInput: "TextInput",
  View: "View",
}));

vi.mock("@/components/styled/rneui", () => ({
  Text: "Text",
}));
vi.mock("@/components/ThemedIcon", () => ({ ThemedIcon: "ThemedIcon" }));
vi.mock("lucide-react-native", () => ({ ArrowUp: "ArrowUp", X: "X" }));

vi.mock("@/constants/colors.tw", () => ({
  colors: { primary: { bg: "bg-primary" } },
}));

import {
  clampDanmakuDraft,
  DANMAKU_COMPOSER_MAX_LENGTH,
  DANMAKU_COMPOSER_PLACEHOLDER,
  DanmakuComposerView,
} from "./DanmakuComposer";

type ElementProps = {
  accessibilityLabel?: string;
  accessibilityState?: { disabled?: boolean; busy?: boolean };
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  onChangeText?: (value: string) => void;
  onPress?: () => void;
  placeholder?: string;
  value?: string;
};

function expectElement(node: ReactNode): ReactElement<ElementProps> {
  if (!React.isValidElement<ElementProps>(node)) {
    throw new Error("Expected a React element");
  }
  return node;
}

function getChildren(element: ReactElement<ElementProps>) {
  return React.Children.toArray(element.props.children).map(expectElement);
}

function renderComposer(draft: string, pending = false) {
  const handlers = {
    onChangeText: vi.fn(),
    onSubmit: vi.fn(),
    onClose: vi.fn(),
  };
  const root = expectElement(DanmakuComposerView({ draft, pending, ...handlers }));
  // View > KeyboardAvoidingView > View > [输入框, 计数, 发送, 关闭]
  const [row] = getChildren(getChildren(root)[0]);
  return { handlers, row, controls: getChildren(row) };
}

describe("DanmakuComposerView", () => {
  test("disables sending while the draft is empty", () => {
    const { controls } = renderComposer("");
    const [input, counter, send] = controls;

    expect(input.props.value).toBe("");
    expect(input.props.placeholder).toBe(DANMAKU_COMPOSER_PLACEHOLDER);
    expect(input.props.maxLength).toBe(DANMAKU_COMPOSER_MAX_LENGTH);
    expect(input.props.accessibilityLabel).toBe("弹幕输入框");
    expect(counter.props.children).toBe(`0/${DANMAKU_COMPOSER_MAX_LENGTH}`);
    expect(send.props.disabled).toBe(true);
    expect(send.props.accessibilityState).toEqual({ disabled: true, busy: false });
  });

  test("sends and closes through the provided handlers", () => {
    const { handlers, controls } = renderComposer("你好");
    const [input, counter, send, close] = controls;

    expect(counter.props.children).toBe(`2/${DANMAKU_COMPOSER_MAX_LENGTH}`);
    expect(send.props.disabled).toBe(false);
    expect(send.props.className).toContain("bg-primary");

    input.props.onChangeText?.("新内容");
    expect(handlers.onChangeText).toHaveBeenCalledWith("新内容");

    send.props.onPress?.();
    expect(handlers.onSubmit).toHaveBeenCalledOnce();

    expect(close.props.accessibilityLabel).toBe("关闭弹幕输入框");
    close.props.onPress?.();
    expect(handlers.onClose).toHaveBeenCalledOnce();
  });

  test("shows a spinner and blocks sending while the request is pending", () => {
    const { controls } = renderComposer("你好", true);
    const [, , send] = controls;

    expect(send.props.disabled).toBe(true);
    expect(send.props.accessibilityState).toEqual({ disabled: true, busy: true });
    expect(React.isValidElement(send.props.children)).toBe(true);
    expect(expectElement(send.props.children).type).toBe("ActivityIndicator");
  });

  test("highlights the counter at the length limit", () => {
    const { controls } = renderComposer("字".repeat(DANMAKU_COMPOSER_MAX_LENGTH));
    const [, counter] = controls;

    expect(counter.props.children).toBe(
      `${DANMAKU_COMPOSER_MAX_LENGTH}/${DANMAKU_COMPOSER_MAX_LENGTH}`,
    );
    expect(counter.props.className).toContain("text-orange-400");
  });
});

describe("clampDanmakuDraft", () => {
  test("truncates by code point", () => {
    expect(clampDanmakuDraft("字".repeat(DANMAKU_COMPOSER_MAX_LENGTH + 5))).toHaveLength(
      DANMAKU_COMPOSER_MAX_LENGTH,
    );
    expect([...clampDanmakuDraft("👍".repeat(120))]).toHaveLength(DANMAKU_COMPOSER_MAX_LENGTH);
  });

  test("replaces line breaks so the danmaku stays single line", () => {
    expect(clampDanmakuDraft("第一行\n第二行")).toBe("第一行 第二行");
    expect(clampDanmakuDraft("a\r\nb")).toBe("a b");
  });
});
