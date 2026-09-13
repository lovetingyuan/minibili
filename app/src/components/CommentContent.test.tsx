import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { CommentImage } from "@/api/comments.types";

const mocks = vi.hoisted(() => ({
  setCurrentImageIndex: vi.fn(),
  setImagesList: vi.fn(),
}));

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ push: vi.fn() }),
}));
vi.mock("expo-clipboard", () => ({ setStringAsync: vi.fn() }));
vi.mock("react-native", () => ({
  Linking: { openURL: vi.fn() },
  Pressable: "Pressable",
  View: "View",
}));
vi.mock("@/components/styled/expo", () => ({ Image: "Image" }));
vi.mock("@/components/styled/rneui", () => ({ Icon: "Icon", Text: "Text" }));
vi.mock("@/constants/colors.tw", () => import("../constants/colors.tw"));
vi.mock("@/store", () => ({
  useStore: () => ({
    setCurrentImageIndex: mocks.setCurrentImageIndex,
    setImagesList: mocks.setImagesList,
  }),
}));
vi.mock("@/utils", () => ({
  getImagePixelSize: vi.fn(),
  parseImgUrl: (url: string) => url,
  showToast: vi.fn(),
}));
vi.mock("./UpName", () => ({ default: "UpName" }));

import { CommentImages } from "./CommentContent";

type ImageEntryProps = {
  accessibilityLabel?: string;
  children?: ReactNode;
  onPress?: () => void;
};

function makeImages(count: number): CommentImage[] {
  return Array.from({ length: count }, (_, index) => ({
    src: `${index}.jpg`,
    width: 100,
    height: 100,
    ratio: 1,
  }));
}

describe("CommentImages", () => {
  beforeEach(() => vi.clearAllMocks());

  test("does not render an entry when the comment has no images", () => {
    expect(CommentImages({ images: [] })).toBeNull();
  });

  test.each([1, 3])("renders one inline image-count entry for %i image(s)", (count) => {
    const images = makeImages(count);
    const entry = CommentImages({ images }) as ReactElement<ImageEntryProps>;

    expect(entry.type).toBe("Text");
    expect(entry.props.accessibilityLabel).toBe(`查看评论中的 ${count} 张图片`);
    expect(String(entry.props.children)).toContain(`${count} 张图片`);

    entry.props.onPress?.();

    expect(mocks.setCurrentImageIndex).toHaveBeenCalledWith(0);
    expect(mocks.setImagesList).toHaveBeenCalledWith(images);
  });
});
