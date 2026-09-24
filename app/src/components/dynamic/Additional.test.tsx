import React from "react";
import { Linking } from "react-native";
import { beforeEach, expect, test, vi } from "vitest";

import type { DynamicAdditional } from "@/api/dynamic-items.type";

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mocks.navigate }),
}));
vi.mock("lucide-react-native", () => ({
  ChevronRight: "ChevronRight",
  CirclePlay: "CirclePlay",
}));
vi.mock("react-native", () => ({
  Linking: { openURL: vi.fn() },
  Pressable: "Pressable",
  View: "View",
}));
vi.mock("@/components/ThemedIcon", () => ({ ThemedIcon: "ThemedIcon" }));
vi.mock("@/components/styled/expo", () => ({ Image: "Image" }));
vi.mock("@/components/styled/rneui", () => ({ Text: "Text" }));
vi.mock("@/constants/theme", () => import("../../constants/theme"));
vi.mock("@/utils", () => ({
  getImagePixelDimensions: (width: number, height: number) => ({ width, height }),
  parseImgUrl: String,
}));

import { Additional } from "./Additional";

const video = {
  head: "视频",
  title: "关联视频",
  description: "1.2万观看 88弹幕",
  cover: "cover.jpg",
  url: "https://www.bilibili.com/video/BV1XctB6PEuZ",
  bvid: "BV1XctB6PEuZ",
} satisfies DynamicAdditional;

beforeEach(() => {
  vi.clearAllMocks();
});

test("opens an additional video in the native player", () => {
  const card = Additional({ additional: video });
  const stopPropagation = vi.fn();

  if (!card) {
    throw new Error("Missing additional card");
  }

  card.props.onPress({ stopPropagation });

  expect(stopPropagation).toHaveBeenCalledOnce();
  expect(mocks.navigate).toHaveBeenCalledWith("Play", {
    bvid: "BV1XctB6PEuZ",
    title: "关联视频",
    cover: "cover.jpg",
    desc: "1.2万观看 88弹幕",
  });
  expect(Linking.openURL).not.toHaveBeenCalled();
  expect(card.props.accessibilityLabel).toBe("播放视频：关联视频");
});

test("keeps non-video additions opening their external link", () => {
  const card = Additional({
    additional: {
      head: "预约",
      title: "预约活动",
      description: "明天开始",
      url: "https://www.bilibili.com/blackboard/activity",
    },
  });

  if (!card) {
    throw new Error("Missing additional card");
  }

  card.props.onPress({ stopPropagation: vi.fn() });

  expect(Linking.openURL).toHaveBeenCalledWith(
    "https://www.bilibili.com/blackboard/activity",
  );
  expect(mocks.navigate).not.toHaveBeenCalled();
});

test("uses a compact 16:9 cover and an icon instead of the wide default action", () => {
  const card = Additional({ additional: video });

  if (!card) {
    throw new Error("Missing additional card");
  }
  const children = React.Children.toArray(card.props.children);
  const cover = children.find(
    (child) => React.isValidElement<Record<string, unknown>>(child) && child.type === "Image",
  );
  const trailing = children.find(
    (child) =>
      React.isValidElement<Record<string, unknown>>(child) &&
      child.type === "View" &&
      child.props.className === "ml-2 shrink-0",
  );

  if (
    !React.isValidElement<Record<string, unknown>>(cover) ||
    !React.isValidElement<Record<string, unknown>>(trailing) ||
    !React.isValidElement<Record<string, unknown>>(trailing.props.children)
  ) {
    throw new Error("Missing cover or trailing icon");
  }
  expect(cover.props.className).toContain("aspect-video");
  expect(cover.props.className).toContain("w-24");
  expect(trailing.props.children.props.icon).toBe("CirclePlay");
});
