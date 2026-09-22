import React from "react";
import type { ReactElement } from "react";
import { expect, test, vi } from "vitest";

vi.mock("react-native", () => ({
  Image: "Image",
  Pressable: "Pressable",
  Text: "Text",
  View: "View",
}));

import { Avatar } from "./Avatar";

type ElementProps = {
  accessibilityRole?: string;
  children?: React.ReactNode;
  className?: string;
  source?: unknown;
  style?: unknown;
};

type TestElement = ReactElement<ElementProps>;

function children(element: TestElement) {
  return React.Children.toArray(element.props.children).filter(
    React.isValidElement,
  ) as TestElement[];
}

test("静态头像使用 View，并按传入尺寸裁剪为圆形", () => {
  const avatar = Avatar({ rounded: true, size: 40, source: { uri: "avatar.jpg" } }) as TestElement;
  const [overlay] = children(avatar);
  const [image] = children(overlay);

  expect(avatar.type).toBe("View");
  expect(avatar.props.className).toContain("rounded-full");
  expect(avatar.props.style).toEqual([{ height: 40, width: 40 }, undefined]);
  expect(image.type).toBe("Image");
  expect(image.props.source).toEqual({ uri: "avatar.jpg" });
});

test("没有图片时展示首字母占位", () => {
  const avatar = Avatar({ size: 28, title: "哔" }) as TestElement;
  const [overlay] = children(avatar);
  const [title] = children(overlay);

  expect(title.type).toBe("Text");
  expect(title.props.children).toBe("哔");
  expect(title.props.style).toEqual([{ fontSize: 14 }, undefined]);
});

test("有交互回调时使用按钮语义的 Pressable", () => {
  const avatar = Avatar({ onPress: vi.fn(), source: { uri: "avatar.jpg" } }) as TestElement;

  expect(avatar.type).toBe("Pressable");
  expect(avatar.props.accessibilityRole).toBe("button");
});
