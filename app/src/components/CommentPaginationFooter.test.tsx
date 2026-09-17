import type { ReactElement, ReactNode } from "react";
import { expect, test, vi } from "vitest";

vi.mock("react-native", () => ({ Pressable: "Pressable", View: "View" }));
vi.mock("@/components/styled/rneui", () => ({ Text: "Text" }));
vi.mock("@/constants/colors.tw", () => import("../constants/colors.tw"));

import CommentPaginationFooter from "./CommentPaginationFooter";

type ElementProps = {
  accessibilityLabel?: string;
  children?: ReactNode;
  onPress?: () => void;
};

function text(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!value || typeof value !== "object" || !("props" in value)) return "";
  const element = value as ReactElement<ElementProps>;
  const children = Array.isArray(element.props.children)
    ? element.props.children
    : [element.props.children];
  return children.map(text).join("");
}

function findElement(value: ReactNode, type: string): ReactElement<ElementProps> | null {
  if (!value || typeof value !== "object" || !("props" in value)) return null;
  const element = value as ReactElement<ElementProps>;
  if (element.type === type) return element;
  const children = Array.isArray(element.props.children)
    ? element.props.children
    : [element.props.children];
  for (const child of children) {
    const found = findElement(child, type);
    if (found) return found;
  }
  return null;
}

function render(overrides: Partial<Parameters<typeof CommentPaginationFooter>[0]> = {}) {
  return CommentPaginationFooter({
    error: undefined,
    hasItems: true,
    isPageEnd: false,
    isValidating: false,
    noun: "评论",
    onRetry: vi.fn(),
    ...overrides,
  });
}

test("renders the loading, available and terminal pagination states", () => {
  expect(text(render({ isValidating: true }))).toContain("正在加载...");
  expect(text(render())).toContain("上拉加载更多");
  expect(text(render({ isPageEnd: true }))).toContain("没有更多评论了");
  expect(text(render({ hasItems: false }))).toBe("");
});

test("renders a retry button instead of an anonymous-state message after an error", () => {
  const onRetry = vi.fn();
  const tree = render({ error: new Error("network"), noun: "回复", onRetry });
  const button = findElement(tree, "Pressable");

  expect(text(tree)).toContain("加载失败，点击重试");
  expect(text(tree)).not.toContain("匿名状态");
  expect(button?.props.accessibilityLabel).toBe("加载回复失败，点击重试");
  button?.props.onPress?.();
  expect(onRetry).toHaveBeenCalledOnce();
});
