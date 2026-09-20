import React from "react";
import type { ReactElement, ReactNode } from "react";
import { expect, test, vi } from "vitest";

import type { DynamicItem } from "@/api/dynamic-items.type";

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mocks.navigate }),
}));
vi.mock("react-native", () => ({ Pressable: "Pressable", View: "View" }));
vi.mock("@/constants/colors.tw", () => import("../../constants/colors.tw"));
vi.mock("@/utils", () => ({
  getImagePixelSize: (size: number) => size,
  parseDate: String,
  parseImgUrl: String,
  parseNumber: String,
}));
vi.mock("../Additional", () => ({ Additional: "Additional" }));
vi.mock("../RichTexts", () => ({ default: "RichTexts" }));
vi.mock("../styled/rneui", () => ({ Avatar: "Avatar", Icon: "Icon", Text: "Text" }));
vi.mock("../UpName", () => ({ default: "UpName" }));
vi.mock("./dynamic-actions", () => ({ DynamicActions: "DynamicActions" }));
vi.mock("./dynamic-media", () => ({ DynamicMedia: "DynamicMedia" }));

import { DynamicCard } from "./dynamic-card";

const item = {
  id: "dynamic-1",
  sourceType: "DYNAMIC_TYPE_WORD",
  author: { mid: 1, name: "UP", face: "" },
  date: "2026-09-01",
  time: 0,
  pubAction: "发布了动态",
  top: false,
  title: "",
  text: "动态正文",
  richTextNodes: [],
  topic: null,
  content: { kind: "text" },
  additional: null,
  commentId: "1",
  commentType: 17,
  stats: { comment: 0, like: 0, forward: 0 },
  url: "",
  original: null,
} satisfies DynamicItem;

function text(node: ReactNode): string {
  return React.Children.toArray(node)
    .map((child) => {
      if (React.isValidElement<{ children?: ReactNode }>(child)) {
        return text(child.props.children);
      }
      return typeof child === "string" ? child : "";
    })
    .join("");
}

type TestElement = ReactElement<Record<string, unknown>>;

function flatten(node: ReactNode): TestElement[] {
  const elements: TestElement[] = [];
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement<Record<string, unknown>>(child)) {
      return;
    }
    if (typeof child.type === "function") {
      const Component = child.type as (props: Record<string, unknown>) => ReactNode;
      elements.push(...flatten(Component(child.props)));
      return;
    }
    elements.push(child);
    elements.push(...flatten(child.props.children as ReactNode));
  });
  return elements;
}

test("keeps the card body pressable and renders the action bar separately", () => {
  const card = DynamicCard({ item, onPress: vi.fn() });
  const directChildren = React.Children.toArray(card.props.children) as ReactElement[];
  const bodyPressable = directChildren.find((child) => child.type === "Pressable");

  if (!bodyPressable) {
    throw new Error("Missing body pressable");
  }
  expect(directChildren.some((child) => child.type === "DynamicActions")).toBe(true);
  expect(text(card)).not.toContain("播放视频");
  expect(text(card)).not.toContain("查看动态详情");
});

test("renders a pinned dynamic as a tag", () => {
  const elements = flatten(DynamicCard({ item: { ...item, top: true } }));
  const tag = elements.find((element) => element.props.accessibilityLabel === "置顶标签");

  expect(tag?.type).toBe("View");
  expect(tag?.props.className).toContain("rounded");
  expect(tag?.props.className).toContain("bg-pink-50");
});

test("renders the OPUS title above the body text", () => {
  const elements = flatten(
    DynamicCard({
      item: {
        ...item,
        title: "继续建设牛牛快乐屋😋",
        text: "分享图片",
        content: { kind: "images", images: [] },
      },
    }),
  );
  const titleIndex = elements.findIndex(
    (element) => element.type === "Text" && element.props.children === "继续建设牛牛快乐屋😋",
  );
  const bodyIndex = elements.findIndex(
    (element) => element.type === "Text" && element.props.children === "分享图片",
  );

  expect(titleIndex).toBeGreaterThanOrEqual(0);
  expect(titleIndex).toBeLessThan(bodyIndex);
});

test("renders no title row when the dynamic has no title", () => {
  const titles = flatten(DynamicCard({ item })).filter(
    (element) =>
      element.type === "Text" &&
      typeof element.props.className === "string" &&
      element.props.className.includes("font-semibold"),
  );
  const body = flatten(DynamicCard({ item })).find(
    (element) => element.type === "Text" && element.props.children === "动态正文",
  );

  expect(titles).toHaveLength(0);
  expect(body).toBeDefined();
});

test("opens the author space from the avatar and the UP name", () => {
  mocks.navigate.mockClear();
  const elements = flatten(DynamicCard({ item, onPress: vi.fn() }));
  const avatar = elements.find(
    (element) =>
      element.type === "Pressable" && typeof element.props.accessibilityLabel === "string",
  );
  const name = elements.find((element) => element.type === "UpName");

  if (!avatar || !name) {
    throw new Error("Missing author avatar or name");
  }

  (avatar.props.onPress as () => void)();
  expect(mocks.navigate).toHaveBeenLastCalledWith("Dynamic", {
    user: { face: "", mid: 1, name: "UP", sign: "" },
  });

  (name.props.onPress as () => void)();
  expect(mocks.navigate).toHaveBeenLastCalledWith("Dynamic", {
    user: { face: "", mid: 1, name: "UP", sign: "" },
  });
  expect(mocks.navigate).toHaveBeenCalledTimes(2);
});

test("opens the original author space from a forwarded dynamic", () => {
  mocks.navigate.mockClear();
  const elements = flatten(
    DynamicCard({
      item: {
        ...item,
        original: {
          ...item,
          id: "dynamic-2",
          author: { mid: 2, name: "原作者", face: "face.jpg" },
        },
      },
      onPress: vi.fn(),
    }),
  );
  const names = elements.filter((element) => element.type === "UpName");

  expect(names).toHaveLength(2);
  (names[1].props.onPress as () => void)();
  expect(mocks.navigate).toHaveBeenLastCalledWith("Dynamic", {
    user: { face: "face.jpg", mid: 2, name: "原作者", sign: "" },
  });
});
