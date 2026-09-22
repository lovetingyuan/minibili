import React from "react";
import type { ReactElement, ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";

vi.mock("react-native", () => ({ View: "View" }));
vi.mock("@/constants/colors.tw", () => import("../../constants/colors.tw"));

import { WatchProgressBar } from "./WatchProgressBar";

type ElementProps = { children?: ReactNode; className?: string; style?: { width?: string } };

function elements(node: ReactNode): ReactElement<ElementProps>[] {
  const result: ReactElement<ElementProps>[] = [];
  React.Children.forEach(node, (child) => {
    if (React.isValidElement<ElementProps>(child)) {
      result.push(child, ...elements(child.props.children));
    }
  });
  return result;
}

function fillWidth(bar: ReactNode) {
  const track = elements(bar).find((element) =>
    element.props.className?.includes("bg-gray-900/40"),
  );
  return elements(track).find((element) => element.props.className?.includes("bg-sky-500"))?.props
    .style?.width;
}

describe("WatchProgressBar", () => {
  test("hides itself when there is no usable progress", () => {
    expect(WatchProgressBar({ ratio: 0 })).toBeNull();
    expect(WatchProgressBar({ ratio: -1 })).toBeNull();
    expect(WatchProgressBar({ ratio: Number.NaN })).toBeNull();
  });

  test("draws a bottom-edge bar with the rounded ratio", () => {
    const bar = WatchProgressBar({ ratio: 0.25 });
    const track = elements(bar).find((element) =>
      element.props.className?.includes("bg-gray-900/40"),
    );
    expect(track?.props.className).toContain("absolute bottom-0 left-0 h-2 w-full");
    expect(fillWidth(bar)).toBe("25%");
  });

  test("clamps out-of-range ratios", () => {
    expect(fillWidth(WatchProgressBar({ ratio: 1 }))).toBe("100%");
    expect(fillWidth(WatchProgressBar({ ratio: 1.4 }))).toBe("100%");
  });

  test("keeps a barely watched video visible", () => {
    expect(fillWidth(WatchProgressBar({ ratio: 0.001 }))).toBe("2%");
    expect(fillWidth(WatchProgressBar({ ratio: 0.02 }))).toBe("2%");
  });
});
