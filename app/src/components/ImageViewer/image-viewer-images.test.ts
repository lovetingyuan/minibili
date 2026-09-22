import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("react-native", () => ({
  PixelRatio: { getPixelSizeForLayoutSize: (size: number) => size * 2 },
}));
vi.mock("@/utils", () => import("../../utils/image"));

import { normalizeImages } from "./image-viewer-images";

describe("image viewer previews", () => {
  beforeEach(() => vi.clearAllMocks());

  test("requests a width-limited preview without exceeding the original width", () => {
    expect(
      normalizeImages(
        [{ src: "//i0.hdslb.com/landscape.jpg", width: 600, height: 300, ratio: 2 }],
        400,
        800,
      ),
    ).toEqual([
      {
        uri: "https://i0.hdslb.com/landscape.jpg@600w_!web-dynamic.webp",
        originalUri: "https://i0.hdslb.com/landscape.jpg",
        width: 600,
        height: 300,
      },
    ]);
  });

  test("uses a height limit for long images and strips old parameters from the original", () => {
    const [image] = normalizeImages(
      [
        {
          src: "https://i0.hdslb.com/long.jpg@200w.webp",
          width: 100,
          height: 1000,
          ratio: 0.1,
        },
      ],
      400,
      800,
    );

    expect(image.uri).toBe("https://i0.hdslb.com/long.jpg@1000h_!web-dynamic.webp");
    expect(image.originalUri).toBe("https://i0.hdslb.com/long.jpg");
  });
});
