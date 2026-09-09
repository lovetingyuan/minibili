import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { DynamicAuthor, DynamicImage, DynamicVideoContent } from "@/api/dynamic-items.type";

const mocks = vi.hoisted(() => {
  vi.stubGlobal("__DEV__", false);
  return {
    navigate: vi.fn(),
    setCurrentImageIndex: vi.fn(),
    setImagesList: vi.fn(),
    setOverlayButtons: vi.fn(),
  };
});

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mocks.navigate }),
}));
vi.mock("react-native", () => ({
  Linking: { openURL: vi.fn() },
  Pressable: "Pressable",
  useWindowDimensions: () => ({ width: 400, height: 800 }),
  View: "View",
}));
vi.mock("../styled/expo", () => ({ Image: "Image" }));
vi.mock("../styled/rneui", () => ({ Icon: "Icon", Text: "Text" }));
vi.mock("@/constants/colors.tw", () => import("../../constants/colors.tw"));
vi.mock("@/store", () => ({
  useStore: () => ({
    setCurrentImageIndex: mocks.setCurrentImageIndex,
    setImagesList: mocks.setImagesList,
    setOverlayButtons: mocks.setOverlayButtons,
  }),
}));
vi.mock("@/utils", () => ({
  getImagePixelDimensions: (
    width: number,
    height: number,
    sourceWidth?: number,
    sourceHeight?: number,
  ) => {
    const scale = Math.min(
      1,
      sourceWidth ? sourceWidth / width : 1,
      sourceHeight ? sourceHeight / height : 1,
    );
    return { width: Math.round(width * scale), height: Math.round(height * scale) };
  },
  parseImgUrl: (url: string, size?: { width?: number; height?: number }) =>
    size ? `${url}?${size.width ?? ""}x${size.height ?? ""}` : url,
  parseNumber: String,
}));

import { DynamicMedia } from "./dynamic-media";

type ElementProps = {
  children?: ReactNode;
  className?: string;
  onLongPress?: (event?: { stopPropagation: () => void }) => void;
  onPress?: (event?: { stopPropagation: () => void }) => void;
  source?: { uri: string };
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

function renderImages(images: DynamicImage[]) {
  const media = DynamicMedia({ content: { kind: "images", images }, author });
  if (!media || typeof media.type !== "function") {
    throw new Error("Expected DynamicMedia to return the image grid component");
  }
  const mediaProps = media.props;
  const ImageGrid = media.type as (props: typeof mediaProps) => ReactElement<ElementProps>;
  return ImageGrid(mediaProps);
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

  test("long pressing the cover opens the cover-preview menu in the dynamic list", () => {
    const card = renderVideo(video);
    const [cover] = children(card) as ReactElement<ElementProps>[];

    const stopPropagation = vi.fn();
    cover.props.onLongPress?.({ stopPropagation });

    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(mocks.setOverlayButtons).toHaveBeenCalledWith([
      {
        text: "查看封面",
        onPress: expect.any(Function),
      },
    ]);

    const [button] = mocks.setOverlayButtons.mock.calls[0][0] as {
      text: string;
      onPress: () => void;
    }[];
    button.onPress();

    expect(mocks.setImagesList).toHaveBeenCalledWith([
      { src: "cover.jpg", width: 0, height: 0, ratio: 16 / 9 },
    ]);
    expect(mocks.setCurrentImageIndex).toHaveBeenCalledWith(0);
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

describe("DynamicMedia image sizing", () => {
  beforeEach(() => vi.clearAllMocks());

  test("uses 90% of the viewport for one image and column width for a grid", () => {
    const oneImage = [{ src: "one.jpg", width: 1000, height: 500, ratio: 2 }];
    const oneImageGrid = renderImages(oneImage);
    const [singlePressable] = children(oneImageGrid) as ReactElement<ElementProps>[];
    const [singleImage] = children(singlePressable) as ReactElement<ElementProps>[];
    expect(singleImage.props.source?.uri).toBe("one.jpg?360x200");

    const threeImages = Array.from({ length: 3 }, (_, index) => ({
      src: `${index}.jpg`,
      width: 1000,
      height: 1000,
      ratio: 1,
    }));
    const threeImageGrid = renderImages(threeImages);
    const [firstPressable] = children(threeImageGrid) as ReactElement<ElementProps>[];
    const [firstImage] = children(firstPressable) as ReactElement<ElementProps>[];
    expect(firstImage.props.source?.uri).toBe("0.jpg?120x120");
  });

  test("opens the complete image list at the tapped index", () => {
    const images = Array.from({ length: 3 }, (_, index) => ({
      src: `${index}.jpg`,
      width: 100,
      height: 100,
      ratio: 1,
    }));
    const grid = renderImages(images);
    const pressables = children(grid) as ReactElement<ElementProps>[];

    pressables[1].props.onPress?.();

    expect(mocks.setImagesList).toHaveBeenCalledWith(images);
    expect(mocks.setCurrentImageIndex).toHaveBeenCalledWith(1);
  });
});
