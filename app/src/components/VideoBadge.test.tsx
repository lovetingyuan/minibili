import React from "react";
import { describe, expect, test, vi } from "vitest";

import type { ReactElement, ReactNode } from "react";

vi.mock("@/components/styled/rneui", () => ({ Text: "Text" }));

vi.mock("@/constants/theme", () => ({
  theme: {
    primary: { bg: "bg-brand-blue" },
    secondary: { bg: "bg-brand-pink" },
    warning: { bg: "bg-brand-orange" },
  },
}));

import { VideoBadge } from "./VideoBadge";
import type { VideoBadgeProps } from "./VideoBadge.types";

type ElementProps = {
  children?: ReactNode;
  className?: string;
};

function renderBadge(props: VideoBadgeProps) {
  const element = VideoBadge(props);
  if (!React.isValidElement<ElementProps>(element)) {
    throw new Error("Expected a React element");
  }
  return element as ReactElement<ElementProps>;
}

describe("VideoBadge", () => {
  test("充电专属使用充电橙", () => {
    const badge = renderBadge({ label: "充电专属", tone: "charge" });

    expect(badge.props.children).toBe("充电专属");
    expect(badge.props.className).toContain("bg-brand-orange");
  });

  test("会员与付费使用品牌粉", () => {
    expect(renderBadge({ label: "大会员", tone: "vip" }).props.className).toContain(
      "bg-brand-pink",
    );
    expect(renderBadge({ label: "付费视频", tone: "vip" }).props.className).toContain(
      "bg-brand-pink",
    );
  });

  test("交互视频使用品牌蓝", () => {
    expect(renderBadge({ label: "交互视频", tone: "info" }).props.className).toContain(
      "bg-brand-blue",
    );
  });

  test("封面/播放器用的紧凑形态与附加定位类都会生效", () => {
    const badge = renderBadge({
      label: "充电专属 · 试看",
      tone: "charge",
      variant: "overlay",
      className: "absolute left-2 top-2",
    });

    expect(badge.props.className).toContain("text-[10px]");
    expect(badge.props.className).toContain("absolute left-2 top-2");
  });
});
