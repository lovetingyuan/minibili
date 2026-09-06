import { getImagePixelSize, getOriginalImgUrl, parseImgUrl } from "@/utils";

import type { ImageViewerInput, ImageViewerItem } from "./image-viewer.types";

export function normalizeImages(
  imagesList: ImageViewerInput[],
  windowWidth: number,
  windowHeight: number,
): ImageViewerItem[] {
  return imagesList.map((image) => {
    const ratio =
      image.ratio && image.ratio > 0
        ? image.ratio
        : image.width > 0 && image.height > 0
          ? image.width / image.height
          : 1;
    const maxLayoutWidth = windowWidth * 0.9;
    const maxLayoutHeight = windowHeight * 0.9;
    const widthLimitedHeight = maxLayoutWidth / ratio;
    const options =
      widthLimitedHeight <= maxLayoutHeight
        ? { width: getImagePixelSize(maxLayoutWidth, image.width) }
        : { height: getImagePixelSize(maxLayoutHeight, image.height) };

    return {
      uri: parseImgUrl(image.src, options),
      originalUri: getOriginalImgUrl(image.src),
      width: image.width,
      height: image.height,
    };
  });
}
