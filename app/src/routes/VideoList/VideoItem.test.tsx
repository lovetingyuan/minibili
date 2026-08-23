import React from "react";
import { describe, expect, test, vi } from "vitest";

import type { ReactElement, ReactNode } from "react";

vi.mock("react-native", () => ({
  View: function View() {
    return null;
  },
}));

vi.mock("@/components/styled/rneui", () => ({
  Icon: function Icon() {
    return null;
  },
  Text: function Text() {
    return null;
  },
}));

vi.mock("@/components/styled/expo", () => ({
  Image: function Image() {
    return null;
  },
}));

vi.mock("@/components/WatchProgressBar", () => ({
  default: function WatchProgressBar() {
    return null;
  },
}));

vi.mock("@/constants/colors.tw", () => ({
  colors: {
    primary: {
      accent: "accent-primary",
      text: "text-primary",
    },
    secondary: {
      accent: "accent-secondary",
      text: "text-secondary",
    },
  },
}));

vi.mock("@/store", () => ({
  useStore: () => ({
    $blackTags: {},
    $watchedVideos: {},
    isWiFi: true,
  }),
}));

vi.mock("@/store/derives", () => ({
  useFollowedUpsMap: () => ({}),
}));

vi.mock("@/utils", () => ({
  parseDate: () => "05-10",
  parseDuration: () => "03:31",
  parseImgUrl: (url: string) => url,
  parseNumber: (value: number | string | undefined) => (value === undefined ? "" : String(value)),
}));

import VideoItem from "./VideoItem";

type ElementProps = {
  children?: ReactNode;
  className?: string;
  numberOfLines?: number;
};

function expectElement(node: ReactNode): ReactElement<ElementProps> {
  if (!React.isValidElement<ElementProps>(node)) {
    throw new Error("Expected a React element");
  }

  return node;
}

function getChildren(element: ReactElement<ElementProps>) {
  return React.Children.toArray(element.props.children).map(expectElement);
}

describe("VideoItem", () => {
  test("keeps the title in a two-line bottom-aligned slot", () => {
    const video: React.ComponentProps<typeof VideoItem>["video"] = {
      aid: 1,
      bvid: "BV1",
      cid: 1,
      commentNum: 1,
      cover: "https://example.com/cover.jpg",
      danmuNum: 1,
      date: 1,
      desc: "",
      duration: 211,
      face: "https://example.com/face.jpg",
      height: 300,
      likeNum: 1,
      mid: 1,
      name: "UP",
      playNum: 1000,
      shareNum: 1,
      tag: "小剧场",
      title: "一行标题",
      videosNum: 1,
      width: 480,
    };

    const root = VideoItem({ video });
    const [, content] = getChildren(root);
    const [titleSlot] = getChildren(content);
    const [title] = getChildren(titleSlot);

    expect(titleSlot.props.className).toBe("h-10 justify-end");
    expect(title.props.className).toContain("leading-5");
    expect(title.props.numberOfLines).toBe(2);
  });
});
