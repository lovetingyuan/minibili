import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import type { VideoListItemInfo } from "../types";

vi.mock("./UpName", () => ({ default: "UpName" }));

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  parseDate: vi.fn(() => "08-30"),
}));
vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mocks.navigate }),
}));
vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  TouchableOpacity: "TouchableOpacity",
  useWindowDimensions: () => ({ width: 400, height: 800 }),
  View: "View",
}));
vi.mock("@/components/styled/rneui", () => ({ Icon: "Icon", Text: "Text" }));
vi.mock("@/components/styled/expo", () => ({ Image: "Image" }));
vi.mock("@/constants/colors.tw", () => import("../constants/colors.tw"));
vi.mock("@/store", () => ({ useStore: () => ({ setOverlayButtons: vi.fn() }) }));
vi.mock("@/store/derives", () => ({ useFollowedUpsMap: () => ({}) }));
vi.mock("@/utils/watch-time", () => import("../utils/watch-time"));
vi.mock("@/utils", () => ({
  getImagePixelDimensions: (width: number, height: number) => ({ width, height }),
  isDefined: (value: unknown) => value !== undefined && value !== null,
  parseDate: mocks.parseDate,
  parseDuration: String,
  parseDurationStr: String,
  parseImgUrl: String,
  parseNumber: String,
}));

import VideoListItem from "./VideoItem";
import { WatchProgressBar } from "./WatchProgressBar";

function text(node: ReactNode): string {
  return React.Children.toArray(node)
    .map((child) => {
      if (React.isValidElement<{ children?: ReactNode }>(child)) return text(child.props.children);
      return typeof child === "string" ? child : "";
    })
    .join("");
}
function elements(node: ReactNode): ReactElement<{ children?: ReactNode; className?: string }>[] {
  const result: ReactElement<{ children?: ReactNode; className?: string }>[] = [];
  React.Children.forEach(node, (child) => {
    if (React.isValidElement<{ children?: ReactNode; className?: string }>(child)) {
      result.push(child, ...elements(child.props.children));
    }
  });
  return result;
}
const video: VideoListItemInfo = {
  bvid: "BV1",
  aid: 1,
  title: "video",
  name: "UP",
  mid: 2,
  cover: "",
  duration: 90,
};
beforeEach(() => {
  vi.clearAllMocks();
});

test("history shows the exact watch date without a fabricated publication date and opens Play", () => {
  const watchedAt = new Date(2025, 0, 2, 3, 4).getTime() / 1000;
  const row = VideoListItem({ video, watchedAt });
  expect(text(row)).toContain("观看于 2025-01-02 03:04");
  expect(mocks.parseDate).not.toHaveBeenCalled();
  row.props.onPress();
  expect(mocks.navigate).toHaveBeenCalledWith(
    "Play",
    expect.objectContaining({ bvid: "BV1", aid: 1, title: "video" }),
  );
  expect(mocks.navigate.mock.calls[0][1].date).toBeUndefined();
});

test("ordinary cards retain publication dates and the existing cover play-count layout", () => {
  const row = VideoListItem({
    video: { ...video, date: 1788001866, play: 1234 },
    playCountOnCover: true,
  });
  expect(mocks.parseDate).toHaveBeenCalledWith(1788001866);
  expect(text(row)).not.toContain("观看于");
  const coverCount = elements(row).find((element) =>
    element.props.className?.includes("bottom-0 left-0"),
  );
  expect(text(coverCount)).toContain("1234");
  expect(elements(row).some((element) => element.props.className?.includes("bottom-1.5"))).toBe(
    false,
  );
});

test("watch later cards show a cover progress bar only when there is progress", () => {
  const row = VideoListItem({ video, progressRatio: 0.25 });
  const bars = elements(row).filter((element) => element.type === WatchProgressBar);
  expect(bars).toHaveLength(1);
  expect(bars[0].props).toMatchObject({ ratio: 0.25 });

  expect(VideoListItem({ video, progressRatio: 1 })).toBeDefined();
  const complete = elements(VideoListItem({ video, progressRatio: 1 })).find(
    (element) => element.type === WatchProgressBar,
  );
  expect(complete?.props).toMatchObject({ ratio: 1 });

  const plain = elements(VideoListItem({ video })).find(
    (element) => element.type === WatchProgressBar,
  );
  expect(plain?.props).toMatchObject({ ratio: 0 });
});

test("the title does not stretch while metadata stays bottom-aligned", () => {
  const row = VideoListItem({ video });
  const itemElements = elements(row);
  const details = itemElements.find(
    (element) => element.props.className === "flex-[4] justify-between",
  );
  const title = itemElements.find((element) => element.props.className === "text-base");
  const metadata = itemElements.find((element) => element.props.className === "gap-1");

  expect(details).toBeDefined();
  expect(title?.props).toMatchObject({ numberOfLines: 2, ellipsizeMode: "tail" });
  expect(metadata).toBeDefined();
  expect(text(row)).not.toContain("UP:");
  expect(itemElements).toContainEqual(
    expect.objectContaining({
      props: expect.objectContaining({
        name: "account-circle-outline",
        type: "material-community",
      }),
    }),
  );
});
