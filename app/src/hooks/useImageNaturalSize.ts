import React from "react";
import { Image as RNImage, StyleSheet } from "react-native";
import type { ImageLoadEventData, ImageProps } from "expo-image";

type NaturalImageSize = {
  width: number;
  height: number;
};

function getNaturalSizeFromSource(source: ImageProps["source"]): NaturalImageSize | null {
  if (!source) {
    return null;
  }

  if (typeof source === "number") {
    const asset = RNImage.resolveAssetSource(source);
    if (typeof asset.width === "number" && typeof asset.height === "number") {
      return {
        width: asset.width,
        height: asset.height,
      };
    }
    return null;
  }

  if (Array.isArray(source)) {
    for (const item of source) {
      const naturalSize = getNaturalSizeFromSource(item);
      if (naturalSize) {
        return naturalSize;
      }
    }
    return null;
  }

  if (typeof source === "string") {
    return null;
  }

  if (
    "width" in source &&
    typeof source.width === "number" &&
    "height" in source &&
    typeof source.height === "number"
  ) {
    return {
      width: source.width,
      height: source.height,
    };
  }

  return null;
}

function getSourceKey(source: ImageProps["source"]): string {
  if (!source) {
    return "";
  }

  if (typeof source === "number") {
    return `asset:${source}`;
  }

  if (Array.isArray(source)) {
    return source.map(getSourceKey).join("|");
  }

  if (typeof source === "string") {
    return source;
  }

  if ("uri" in source && typeof source.uri === "string") {
    const cacheKey =
      "cacheKey" in source && typeof source.cacheKey === "string" ? source.cacheKey : source.uri;
    const width = "width" in source && typeof source.width === "number" ? source.width : "";
    const height = "height" in source && typeof source.height === "number" ? source.height : "";
    return `${cacheKey}:${width}x${height}`;
  }

  if (
    "width" in source &&
    typeof source.width === "number" &&
    "height" in source &&
    typeof source.height === "number"
  ) {
    return `size:${source.width}x${source.height}`;
  }

  return "";
}

export default function useImageNaturalSize(props: {
  onLoad?: ImageProps["onLoad"];
  source?: ImageProps["source"];
  style?: ImageProps["style"];
}) {
  const { onLoad, source, style } = props;
  const sourceKey = getSourceKey(source);
  const sourceNaturalSize = getNaturalSizeFromSource(source);
  const [loadedNaturalSize, setLoadedNaturalSize] = React.useState<NaturalImageSize | null>(null);

  React.useEffect(() => {
    setLoadedNaturalSize(null);
  }, [sourceKey]);

  const flatStyle = StyleSheet.flatten(style);
  const naturalSize = loadedNaturalSize ?? sourceNaturalSize;
  const hasAspectRatio = typeof flatStyle?.aspectRatio === "number";
  const hasWidth = flatStyle?.width != null;
  const hasHeight = flatStyle?.height != null;

  let resolvedStyle = style;
  if (naturalSize && !hasAspectRatio) {
    if (!hasWidth && !hasHeight) {
      resolvedStyle = [
        style,
        {
          width: naturalSize.width,
          height: naturalSize.height,
        },
      ];
    } else if (!hasWidth || !hasHeight) {
      resolvedStyle = [
        style,
        {
          aspectRatio: naturalSize.width / naturalSize.height,
        },
      ];
    }
  }

  const handleLoad = (event: ImageLoadEventData) => {
    onLoad?.(event);
    if (event.source.width > 0 && event.source.height > 0) {
      setLoadedNaturalSize({
        width: event.source.width,
        height: event.source.height,
      });
    }
  };

  return {
    handleLoad,
    resolvedStyle,
  };
}
