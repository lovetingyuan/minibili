import React from "react";
import { describe, expect, test, vi } from "vitest";

import type { ReactElement, ReactNode } from "react";

const mocks = vi.hoisted(() => ({ progressRatio: 0 }));

vi.mock("@/components/UpName", () => ({ default: "UpName" }));

vi.mock("react-native", () => ({
  useWindowDimensions: () => ({ width: 400, height: 800 }),
  View: function View() {
    return null;
  },
}));

vi.mock("@/components/styled/rneui", () => ({
  Text: function Text() {
    return null;
  },
}));
vi.mock("@/components/ThemedIcon", () => ({ ThemedIcon: "ThemedIcon" }));
vi.mock("lucide-react-native", () => ({
  CircleCheck: "CircleCheck",
  CirclePlay: "CirclePlay",
  CircleUserRound: "CircleUserRound",
}));

vi.mock("@/components/styled/expo", () => ({
  Image: function Image() {
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
    networkUsage: "wifi",
  }),
}));
vi.mock("@/features/user-data/useUserSettings", () => ({
  useUserSettings: () => ({ values: { $blackTags: {} } }),
}));

vi.mock("@/store/derives", () => ({
  useFollowedUpsMap: () => ({}),
}));

vi.mock("@/store/watch-progress", () => ({
  useWatchProgressRatio: () => mocks.progressRatio,
}));

vi.mock("@/components/WatchProgressBar", () => import("../../components/WatchProgressBar"));

vi.mock("@/utils", () => ({
  getImagePixelDimensions: (width: number, height: number) => ({ width, height }),
  parseDate: () => "05-10",
  parseDuration: () => "03:31",
  parseImgUrl: (url: string) => url,
  parseNumber: (value: number | string | undefined) => (value === undefined ? "" : String(value)),
}));

import VideoItem from "./VideoItem";
import { WatchProgressBar } from "../../components/WatchProgressBar";

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
  test("shows the cover progress bar when the bvid is in the watch history", () => {
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

    mocks.progressRatio = 0.5;
    const [cover] = getChildren(VideoItem({ video }));
    const bar = React.Children.toArray(cover.props.children)
      .map(expectElement)
      .find((child) => child.type === WatchProgressBar);
    expect(bar?.props).toMatchObject({ ratio: 0.5 });

    mocks.progressRatio = 0;
    const [otherCover] = getChildren(VideoItem({ video }));
    const otherBar = React.Children.toArray(otherCover.props.children)
      .map(expectElement)
      .find((child) => child.type === WatchProgressBar);
    expect(otherBar?.props).toMatchObject({ ratio: 0 });
  });

  test("keeps the title in a two-line top-aligned slot", () => {
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

    expect(titleSlot.props.className).toBe("h-10 justify-start");
    expect(title.props.className).toContain("leading-5");
    expect(title.props.numberOfLines).toBe(2);
  });
});
