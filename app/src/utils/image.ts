import { PixelRatio } from "react-native";

import type { BilibiliImageOptions } from "./image.types";

const BILIBILI_IMAGE_HOSTS = ["hdslb.com", "biliimg.com"];
const BILIBILI_IMAGE_SUFFIX = /^(.*\.(?:avif|gif|jpe?g|png|webp))@[^?#]*$/i;

export function parseUrl(url: string) {
  const normalizedUrl = url.startsWith("//") ? `https:${url}` : url;
  return normalizedUrl.startsWith("http://")
    ? `https://${normalizedUrl.slice("http://".length)}`
    : normalizedUrl;
}

function isBilibiliImageUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return BILIBILI_IMAGE_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

function splitUrlSuffix(url: string) {
  const queryIndex = url.indexOf("?");
  const hashIndex = url.indexOf("#");
  const suffixIndex = [queryIndex, hashIndex]
    .filter((index) => index >= 0)
    .reduce((first, index) => Math.min(first, index), url.length);

  return {
    path: url.slice(0, suffixIndex),
    suffix: url.slice(suffixIndex),
  };
}

export function getOriginalImgUrl(url: string) {
  const normalizedUrl = parseUrl(url);
  if (!isBilibiliImageUrl(normalizedUrl)) {
    return normalizedUrl;
  }

  const { path, suffix } = splitUrlSuffix(normalizedUrl);
  const match = path.match(BILIBILI_IMAGE_SUFFIX);
  return `${match?.[1] ?? path}${suffix}`;
}

function normalizeDimension(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return Math.max(1, Math.round(value));
}

export function getImagePixelSize(layoutSize: number, sourceSize?: number) {
  const normalizedLayoutSize = Number.isFinite(layoutSize) ? Math.max(1, layoutSize) : 1;
  const pixelSize =
    normalizeDimension(PixelRatio.getPixelSizeForLayoutSize(normalizedLayoutSize)) ?? 1;
  const normalizedSourceSize =
    typeof sourceSize === "number" && Number.isFinite(sourceSize) && sourceSize > 0
      ? Math.round(sourceSize)
      : undefined;
  return normalizedSourceSize ? Math.min(pixelSize, normalizedSourceSize) : pixelSize;
}

export function getImagePixelDimensions(
  layoutWidth: number,
  layoutHeight: number,
  sourceWidth?: number,
  sourceHeight?: number,
) {
  const width = getImagePixelSize(layoutWidth);
  const height = getImagePixelSize(layoutHeight);
  const widthScale = sourceWidth && sourceWidth > 0 ? sourceWidth / width : 1;
  const heightScale = sourceHeight && sourceHeight > 0 ? sourceHeight / height : 1;
  const scale = Math.min(1, widthScale, heightScale);

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function parseImgUrl(url: string): string;
export function parseImgUrl(url: string, size: number): string;
export function parseImgUrl(url: string, width: number, height: number): string;
export function parseImgUrl(url: string, options: BilibiliImageOptions): string;
export function parseImgUrl(
  url: string,
  widthOrOptions?: number | BilibiliImageOptions,
  height?: number,
): string {
  const normalizedUrl = parseUrl(url);
  if (!isBilibiliImageUrl(normalizedUrl)) {
    return normalizedUrl;
  }

  const originalUrl = getOriginalImgUrl(normalizedUrl);
  const options =
    typeof widthOrOptions === "number"
      ? {
          width: widthOrOptions,
          height: typeof height === "number" ? height : widthOrOptions,
          crop: true,
        }
      : (widthOrOptions ?? {});
  const width = normalizeDimension(options.width);
  const normalizedHeight = normalizeDimension(options.height);

  if (!width && !normalizedHeight) {
    return originalUrl;
  }

  const dimensions = [width ? `${width}w` : "", normalizedHeight ? `${normalizedHeight}h` : ""]
    .filter(Boolean)
    .join("_");
  const crop = width && normalizedHeight && options.crop !== false ? "_1c" : "";
  const { path, suffix } = splitUrlSuffix(originalUrl);

  return `${path}@${dimensions}${crop}_!web-dynamic.webp${suffix}`;
}
