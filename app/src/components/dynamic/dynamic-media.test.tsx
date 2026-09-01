import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { DynamicAuthor, DynamicVideoContent } from "@/api/dynamic-items.type";

const mocks = vi.hoisted(() => {
  vi.stubGlobal("__DEV__", false);
  return { navigate: vi.fn() };
});

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mocks.navigate }),
}));
vi.mock("react-native", () => ({
  Linking: { openURL: vi.fn() },
  Pressable: "Pressable",
  View: "View",
}));
vi.mock("../styled/expo", () => ({ Image: "Image" }));
vi.mock("../styled/rneui", () => ({ Icon: "Icon", Text: "Text" }));
vi.mock("@/constants/colors.tw", () => import("../../constants/colors.tw"));
vi.mock("@/store", () => ({
  useStore: () => ({ setCurrentImageIndex: vi.fn(), setImagesList: vi.fn() }),
}));
vi.mock("@/utils", () => ({
  parseImgUrl: String,
  parseNumber: String,
}));

import { DynamicMedia } from "./dynamic-media";

type ElementProps = {
  children?: ReactNode;
  className?: string;
  onPress?: (event?: { stopPropagation: () => void }) => void;
};

const author: DynamicAuthor = { mid: 1, name: "UP", face: "face.jpg" };
const video: DynamicVideoContent = {
  kind: "video",
  aid: 2,
  bvid: "BV1TEST",
  cover: "cover.jpg",
  title: "视频标题",
  description: "视频简介",
  duration: "01:30",
  play: 100,
  danmaku: 20,
};

function renderVideo(content: DynamicVideoContent, detail?: boolean) {
  const media = DynamicMedia({ content, author, detail });
  if (!media || typeof media.type !== "function") {
    throw new Error("Expected DynamicMedia to return the video component");
  }
  const mediaProps = media.props;
  const VideoComponent = media.type as (props: typeof mediaProps) => ReactElement<ElementProps>;
  return VideoComponent(mediaProps);
}

function children(element: ReactElement<ElementProps>) {
  return Array.isArray(element.props.children)
    ? element.props.children
    : [element.props.children].filter(Boolean);
}

describe("DynamicMedia video interactions", () => {
  beforeEach(() => vi.clearAllMocks());

  test("only the cover opens Play in the dynamic list", () => {
    const card = renderVideo(video);
    expect(card.type).toBe("View");

    const [cover] = children(card) as ReactElement<ElementProps>[];
    expect(cover.type).toBe("Pressable");

    const stopPropagation = vi.fn();
    cover.props.onPress?.({ stopPropagation });

    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(mocks.navigate).toHaveBeenCalledWith(
      "Play",
      expect.objectContaining({ bvid: "BV1TEST", aid: 2, title: "视频标题" }),
    );
  });

  test("a missing bvid leaves the cover non-interactive so the parent can open details", () => {
    const card = renderVideo({ ...video, bvid: "" });
    const [cover] = children(card) as ReactElement<ElementProps>[];

    expect(card.type).toBe("View");
    expect(cover.type).toBe("View");
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  test("the detail page keeps the whole video card clickable", () => {
    const card = renderVideo(video, true);
    expect(card.type).toBe("Pressable");

    card.props.onPress?.();

    expect(mocks.navigate).toHaveBeenCalledWith(
      "Play",
      expect.objectContaining({ bvid: "BV1TEST" }),
    );
  });
});
