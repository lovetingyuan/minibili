import React from "react";
import type { ReactElement } from "react";
import { expect, test, vi } from "vitest";

vi.mock("react-native", () => ({
  Image: "Image",
  Pressable: "Pressable",
  StyleSheet: {
    absoluteFill: { bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
    create: (styles: unknown) => styles,
  },
  Text: "Text",
  View: "View",
}));

import { Avatar } from "./Avatar";

type ElementProps = {
  accessibilityRole?: string;
  children?: React.ReactNode;
  className?: string;
  resizeMode?: string;
  source?: unknown;
  style?: unknown;
  testID?: string;
};

type TestElement = ReactElement<ElementProps>;

function children(element: TestElement) {
  return React.Children.toArray(element.props.children).filter(
    React.isValidElement,
  ) as TestElement[];
}

function CustomRoot() {
  return null;
}

function CustomImage() {
  return null;
}

test("静态头像使用 View，并按传入尺寸裁剪为圆形", () => {
  const avatar = Avatar({ rounded: true, size: 40, source: { uri: "avatar.jpg" } }) as TestElement;
  const [overlay] = children(avatar);
  const [image] = children(overlay);

  expect(avatar.type).toBe("View");
  expect(avatar.props.className).toContain("rounded-full");
  expect(avatar.props.style).toContainEqual({ height: 40, width: 40 });
  expect(overlay.props.className).toContain("overflow-hidden");
  expect(overlay.props.testID).toBe("RNE__Avatar__Image");
  expect(image.type).toBe("Image");
  expect(image.props.source).toEqual({ uri: "avatar.jpg" });
});

test("没有图片时展示首字母占位", () => {
  const avatar = Avatar({ size: 28, title: "哔" }) as TestElement;
  const [title] = children(avatar);

  expect(title.type).toBe("Text");
  expect(title.props.children).toBe("哔");
  expect(title.props.style).toContainEqual({ fontSize: 14 });
});

test("有交互回调时使用按钮语义的 Pressable", () => {
  const avatar = Avatar({ onPress: vi.fn(), source: { uri: "avatar.jpg" } }) as TestElement;

  expect(avatar.type).toBe("Pressable");
  expect(avatar.props.accessibilityRole).toBe("button");
});

test("图片加载前或失败时保留标题占位", () => {
  const avatar = Avatar({
    imageProps: { placeholderStyle: { backgroundColor: "gray" }, resizeMode: "cover" },
    size: 40,
    source: { uri: "avatar.jpg" },
    title: "哔",
  }) as TestElement;
  const [overlay] = children(avatar);
  const [placeholder, image] = children(overlay);
  const [title] = children(placeholder);

  expect(title.props.children).toBe("哔");
  expect(placeholder.props.style).toContainEqual({ backgroundColor: "gray" });
  expect(image.props.resizeMode).toBe("cover");
});

test("支持图标、自定义内容和外挂子元素", () => {
  const icon = React.createElement("Icon");
  const accessory = React.createElement("Accessory");
  const avatar = Avatar({ children: accessory, icon }) as TestElement;

  expect(children(avatar).map((child) => child.type)).toEqual(["Icon", "Accessory"]);
});

test("支持自定义根组件和图片组件", () => {
  const avatar = Avatar({
    Component: CustomRoot,
    ImageComponent: CustomImage,
    source: { uri: "avatar.jpg" },
  }) as TestElement;
  const [overlay] = children(avatar);
  const [image] = children(overlay);

  expect(avatar.type).toBe(CustomRoot);
  expect(image.type).toBe(CustomImage);
});
