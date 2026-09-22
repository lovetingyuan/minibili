import React from "react";
import type { ReactElement } from "react";
import { expect, test, vi } from "vitest";

vi.mock("react-native", () => ({
  StyleSheet: { hairlineWidth: 0.5 },
  Text: "Text",
  View: "View",
}));

import { Divider } from "./Divider";

type ElementProps = {
  children?: React.ReactNode;
  className?: string;
  style?: unknown;
};

type TestElement = ReactElement<ElementProps>;

function children(element: TestElement) {
  return React.Children.toArray(element.props.children).filter(
    React.isValidElement,
  ) as TestElement[];
}

test("默认渲染主题色的水平 hairline", () => {
  const divider = Divider({ className: "my-4" }) as TestElement;
  const [line] = children(divider);

  expect(line.type).toBe("View");
  expect(line.props.className).toContain("border-gray-300");
  expect(line.props.className).toContain("my-4");
  expect(line.props.style).toEqual([{ borderBottomWidth: 0.5 }, undefined, undefined]);
});

test("垂直 Divider 使用右边框并撑满父容器", () => {
  const divider = Divider({ color: "red", orientation: "vertical", width: 2 }) as TestElement;
  const [line] = children(divider);

  expect(line.props.style).toEqual([
    { alignSelf: "stretch", borderRightColor: "red", borderRightWidth: 2 },
    undefined,
    undefined,
  ]);
});

test("middle inset 同时缩进两侧", () => {
  const divider = Divider({ inset: true, insetType: "middle" }) as TestElement;
  const [line] = children(divider);
  const styles = line.props.style as unknown[];

  expect(styles[1]).toEqual({ marginLeft: 72, marginRight: 72 });
});
