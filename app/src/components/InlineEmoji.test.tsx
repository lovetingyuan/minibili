import type { ReactElement } from "react";
import { describe, expect, test, vi } from "vitest";

vi.mock("@/components/styled/expo", () => ({ Image: "Image" }));
vi.mock("@/utils", () => ({
  getImagePixelSize: (size: number) => size,
  parseImgUrl: (url: string, size: number) => `${url}?${size}`,
}));

import { getInlineEmojiOffset, InlineEmoji } from "./InlineEmoji";

type ImageProps = {
  contentFit?: string;
  source?: { uri: string };
  style?: {
    height?: number;
    width?: number;
    transform?: { translateY: number }[];
  };
};

describe("InlineEmoji", () => {
  test("shifts the emoji down so it centers on the text optical center", () => {
    expect(getInlineEmojiOffset(18, 15)).toBe(4);
    expect(getInlineEmojiOffset(20, 16)).toBe(4.5);
    expect(getInlineEmojiOffset(20, 14)).toBe(5);
    expect(getInlineEmojiOffset(20, 18)).toBe(3.5);
  });

  test("keeps equal blank space on both sides of the emoji", () => {
    const emoji = InlineEmoji({
      url: "//i0.hdslb.com/emoji.png",
      size: 18,
      fontSize: 15,
    }) as ReactElement<ImageProps>;

    expect(emoji.type).toBe("Image");
    expect(emoji.props.contentFit).toBe("contain");
    expect(emoji.props.style?.width).toBe(26);
    expect(emoji.props.style?.height).toBe(18);
    expect(emoji.props.source?.uri).toBe("//i0.hdslb.com/emoji.png?18");
    expect(emoji.props.style?.transform).toEqual([{ translateY: 4 }]);
  });
});
