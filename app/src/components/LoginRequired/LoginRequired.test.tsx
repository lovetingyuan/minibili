import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  openBilibiliLogin: vi.fn(),
}));

vi.mock("react-native", () => ({ View: "View" }));
vi.mock("@/components/styled/rneui", () => ({ Button: "Button", Text: "Text" }));
vi.mock("@/constants/theme", () => import("../../constants/theme"));
vi.mock("@/routes/navigation", () => ({ openBilibiliLogin: mocks.openBilibiliLogin }));

import { LoginRequired } from "./LoginRequired";

type ElementProps = {
  children?: ReactNode;
  className?: string;
  onPress?: () => void;
  title?: string;
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

beforeEach(() => {
  vi.clearAllMocks();
});

test("居中展示需要登录文案和登录按钮", () => {
  const rendered = elements(LoginRequired({}));
  const container = rendered[0];

  expect(container.props.className).toContain("items-center");
  expect(container.props.className).toContain("justify-center");
  expect(rendered.some((element) => element.props.children === "需要登录 B站")).toBe(true);
  expect(rendered.find((element) => element.type === "Button")?.props.title).toBe("登录 B站");
});

test("支持自定义文案与按钮", () => {
  const rendered = elements(
    LoginRequired({ message: "登录后即可查看", description: "看完再回来", actionText: "去登录" }),
  );

  expect(rendered.some((element) => element.props.children === "登录后即可查看")).toBe(true);
  expect(rendered.some((element) => element.props.children === "看完再回来")).toBe(true);
  expect(rendered.find((element) => element.type === "Button")?.props.title).toBe("去登录");
});

test("点击登录按钮跳转到 B站登录路由", () => {
  const button = elements(LoginRequired({})).find((element) => element.type === "Button");

  button?.props.onPress?.();
  expect(mocks.openBilibiliLogin).toHaveBeenCalledOnce();
});
