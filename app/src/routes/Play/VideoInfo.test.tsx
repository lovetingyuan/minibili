import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  route: {
    params: {
      bvid: "BV1TEST",
      face: "",
      mid: 100,
      name: "测试UP",
      title: "测试视频",
    },
  },
}));

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    default: {
      ...original,
      useState: (initialState: unknown) => [initialState, vi.fn()],
    },
  };
});
vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ push: mocks.push }),
  useRoute: () => mocks.route,
}));
vi.mock("react-native", () => ({
  Linking: { openURL: vi.fn() },
  Pressable: "Pressable",
  View: "View",
}));
vi.mock("lucide-react-native", () => ({
  CalendarDays: "CalendarDays",
  ChevronRight: "ChevronRight",
  CirclePlay: "CirclePlay",
  ListVideo: "ListVideo",
  MessageCircle: "MessageCircle",
  Share2: "Share2",
}));
vi.mock("@/components/Avatar", () => ({ Avatar: "Avatar" }));
vi.mock("@/components/styled/rneui", () => ({ Text: "Text" }));
vi.mock("@/components/ThemedIcon", () => ({ ThemedIcon: "ThemedIcon" }));
vi.mock("@/components/UpName", () => ({ default: "UpName" }));
vi.mock("@/constants/theme", () => import("../../constants/theme"));
vi.mock("@/api/watching-count", () => ({ useWatchingCount: () => undefined }));
vi.mock("@/utils", () => ({
  getImagePixelSize: (size: number) => size,
  handleShareVideo: vi.fn(),
  parseDate: String,
  parseImgUrl: String,
  parseNumber: String,
}));
vi.mock("../../api/video-info", () => ({
  useVideoInfo: () => ({ data: undefined, isLoading: false }),
}));
vi.mock("./description", () => ({ getVideoDescription: () => "" }));
vi.mock("./FavoriteButton", () => ({ default: "FavoriteButton" }));
vi.mock("./LikeButton", () => ({ default: "LikeButton" }));
vi.mock("./VideoDescription", () => ({ default: "VideoDescription" }));
vi.mock("./VideoPagesSheet", () => ({ default: "VideoPagesSheet" }));

import VideoInfo from "./VideoInfo";

type TestElement = ReactElement<{
  children?: ReactNode;
  onPress?: () => void;
  source?: unknown;
  title?: string;
}>;

function elements(node: ReactNode): TestElement[] {
  const result: TestElement[] = [];
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement<{ children?: ReactNode }>(child)) {
      return;
    }
    result.push(child);
    result.push(...elements(child.props.children));
  });
  return result;
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("点击 UP 头像和名称都会进入同一个主页", () => {
  const tree = VideoInfo({ currentPage: 1, setCurrentPage: vi.fn() });
  const rendered = elements(tree);
  const avatar = rendered.find((element) => element.type === "Avatar");
  const name = rendered.find((element) => element.type === "UpName");

  if (!avatar || !name) {
    throw new Error("Missing UP avatar or name");
  }

  avatar.props.onPress?.();
  name.props.onPress?.();

  expect(mocks.push).toHaveBeenCalledTimes(2);
  expect(mocks.push).toHaveBeenNthCalledWith(1, "Dynamic", {
    user: { face: "", mid: 100, name: "测试UP", sign: "-" },
  });
  expect(mocks.push).toHaveBeenNthCalledWith(2, "Dynamic", {
    user: { face: "", mid: 100, name: "测试UP", sign: "-" },
  });
  expect(avatar.props.source).toBeUndefined();
  expect(avatar.props.title).toBe("测");
});
