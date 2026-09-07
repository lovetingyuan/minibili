import React from "react";
import type { ReactElement, ReactNode } from "react";
import { expect, test, vi } from "vitest";

import type { DynamicItem } from "@/api/dynamic-items.type";

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
