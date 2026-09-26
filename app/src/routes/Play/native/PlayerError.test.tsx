import React from "react";
import type { ReactElement, ReactNode } from "react";
import { expect, test, vi } from "vitest";

vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  Pressable: "Pressable",
  Text: "Text",
  View: "View",
}));

vi.mock("@/constants/theme", () => ({
  theme: {
    primary: { bg: "bg-[#00AEEC]" },
    secondary: { accent: "accent-[#FF6699]" },
  },
}));

import PlayerError from "./PlayerError";

type TestElement = ReactElement<{
  accessibilityLabel?: string;
  children?: ReactNode;
  onPress?: () => void;
}>;

function elements(node: ReactNode): TestElement[] {
  const result: TestElement[] = [];
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement<{ children?: ReactNode }>(child)) {
      return;
    }
    result.push(child);
    result.push(...elements(child.props.children));
  });
  return result;
}

function hasText(rendered: TestElement[], text: string) {
  return rendered.some((element) => element.props.children === text);
}

test("受限内容只展示类型与说明，不给重试按钮", () => {
  const onRetry = vi.fn();
  const rendered = elements(
    PlayerError({
      description: "该视频为付费内容，购买后可在 B站 观看",
      onRetry,
      retrying: false,
      showRetry: false,
      title: "需要付费观看",
    }),
  );

  expect(hasText(rendered, "需要付费观看")).toBe(true);
  expect(hasText(rendered, "该视频为付费内容，购买后可在 B站 观看")).toBe(true);
  expect(hasText(rendered, "重试")).toBe(false);
});

test("默认仍然给出重试入口", () => {
  const onRetry = vi.fn();
  const rendered = elements(PlayerError({ onRetry, retrying: false }));
  const retry = rendered.find((element) => element.type === "Pressable");

  expect(retry).toBeDefined();
  expect(hasText(rendered, "重试")).toBe(true);
  retry?.props.onPress?.();
  expect(onRetry).toHaveBeenCalledOnce();
});

test("试看/互动片段的重试按钮可以换成重新播放", () => {
  const onRetry = vi.fn();
  const rendered = elements(
    PlayerError({
      actionLabel: "在 B站 打开",
      description: "该视频为交互视频",
      onAction: vi.fn(),
      onRetry,
      retrying: false,
      retryLabel: "重新播放",
      title: "暂不支持交互视频",
    }),
  );

  expect(hasText(rendered, "在 B站 打开")).toBe(true);
  expect(hasText(rendered, "重新播放")).toBe(true);
  expect(hasText(rendered, "重试")).toBe(false);
});
