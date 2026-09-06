import { PixelRatio } from "react-native";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("react-native", () => ({
  PixelRatio: { getPixelSizeForLayoutSize: (size: number) => size },
}));

import {
  getImagePixelDimensions,
  getImagePixelSize,
  getOriginalImgUrl,
  parseImgUrl,
  parseUrl,
} from "./image";

describe("Bilibili image URLs", () => {
  afterEach(() => vi.restoreAllMocks());

  test("normalizes protocol-relative and insecure URLs", () => {
    expect(parseUrl("//i0.hdslb.com/image.jpg")).toBe("https://i0.hdslb.com/image.jpg");
    expect(parseUrl("http://i0.hdslb.com/image.jpg")).toBe("https://i0.hdslb.com/image.jpg");
  });

  test("builds a cropped WebP URL for the numeric overloads", () => {
    expect(parseImgUrl("//i0.hdslb.com/image.jpg", 472, 264)).toBe(
      "https://i0.hdslb.com/image.jpg@472w_264h_1c_!web-dynamic.webp",
    );
    expect(parseImgUrl("https://i0.hdslb.com/avatar.png", 96)).toBe(
      "https://i0.hdslb.com/avatar.png@96w_96h_1c_!web-dynamic.webp",
    );
  });

  test("supports width-only and uncropped size options", () => {
    expect(parseImgUrl("https://i0.hdslb.com/image.jpg", { width: 472 })).toBe(
      "https://i0.hdslb.com/image.jpg@472w_!web-dynamic.webp",
    );
    expect(
      parseImgUrl("https://i0.hdslb.com/image.jpg", {
        width: 472,
        height: 264,
        crop: false,
      }),
    ).toBe("https://i0.hdslb.com/image.jpg@472w_264h_!web-dynamic.webp");
  });

  test("replaces existing processing parameters and preserves query strings", () => {
    const processed = "https://i0.hdslb.com/image.jpg@960w_540h_1c.webp?token=a@b#preview";
    expect(parseImgUrl(processed, { width: 320 })).toBe(
      "https://i0.hdslb.com/image.jpg@320w_!web-dynamic.webp?token=a@b#preview",
    );
    expect(getOriginalImgUrl(processed)).toBe("https://i0.hdslb.com/image.jpg?token=a@b#preview");
  });

  test("does not add processing parameters to non-Bilibili hosts", () => {
    expect(parseImgUrl("http://example.com/image.jpg", 100)).toBe("https://example.com/image.jpg");
    expect(getOriginalImgUrl("https://example.com/image.jpg@100w.webp")).toBe(
      "https://example.com/image.jpg@100w.webp",
    );
  });

  test("rounds dimensions, clamps positive values and ignores invalid dimensions", () => {
    expect(parseImgUrl("https://i0.hdslb.com/image.jpg", { width: 10.6, height: 0 })).toBe(
      "https://i0.hdslb.com/image.jpg@11w_1h_1c_!web-dynamic.webp",
    );
    expect(parseImgUrl("https://i0.hdslb.com/image.jpg", { width: Number.NaN })).toBe(
      "https://i0.hdslb.com/image.jpg",
    );
  });

  test("converts layout sizes to physical pixels without exceeding the source", () => {
    vi.spyOn(PixelRatio, "getPixelSizeForLayoutSize").mockReturnValue(360);
    expect(getImagePixelSize(120)).toBe(360);
    expect(getImagePixelSize(120, 240)).toBe(240);
    expect(getImagePixelSize(120, 0)).toBe(360);
  });

  test("scales both dimensions together to stay within the source size", () => {
    vi.spyOn(PixelRatio, "getPixelSizeForLayoutSize").mockImplementation((size) => size * 3);
    expect(getImagePixelDimensions(200, 100, 300, 1000)).toEqual({
      width: 300,
      height: 150,
    });
  });
});
