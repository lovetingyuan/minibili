import React from "react";
import { describe, expect, test, vi } from "vitest";

import type { ReactElement, ReactNode } from "react";

vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  ImageBackground: "ImageBackground",
  StyleSheet: { absoluteFill: { position: "absolute" } },
  View: "View",
}));

vi.mock("@/constants/colors.tw", () => ({
  colors: { secondary: { accent: "accent-pink-500 dark:accent-pink-400" } },
}));

vi.mock("@/utils", () => ({
  getImagePixelDimensions: () => 0,
  parseImgUrl: (url: string) => `img:${url}`,
}));

import PlayerPoster from "./PlayerPoster";

const ACCENT_COLOR = "accent-pink-500 dark:accent-pink-400";

type ElementProps = {
  accessibilityLabel?: string;
  children?: ReactNode;
  colorClassName?: string;
  pointerEvents?: string;
  size?: string;
  source?: { uri: string };
};

function expectElement(node: ReactNode): ReactElement<ElementProps> {
  if (!React.isValidElement<ElementProps>(node)) {
    throw new Error("Expected a React element");
  }
  return node;
}

function renderPoster(options: { cover?: string; loading: boolean }) {
  const root = expectElement(
    PlayerPoster({ ...options, containerWidth: 360, containerHeight: 202 }),
  );
  const children = React.Children.toArray(root.props.children).map(expectElement);
  const coverImage = children.find((child) => child.type === "ImageBackground") ?? null;
  const loadingWrapper = children.find((child) => child.type === "View") ?? null;
  const indicator = loadingWrapper ? expectElement(loadingWrapper.props.children) : null;

  return { root, coverImage, indicator };
}

describe("PlayerPoster", () => {
  test("covers the video with the cover and a spinner while waiting for the first frame", () => {
    const { root, coverImage, indicator } = renderPoster({
      cover: "https://example.com/cover.jpg",
      loading: true,
    });

    expect(root.props.pointerEvents).toBe("none");
    expect(coverImage?.props.source).toEqual({ uri: "img:https://example.com/cover.jpg" });
    expect(indicator?.props.accessibilityLabel).toBe("视频加载中");
    expect(indicator?.props.size).toBe("large");
    expect(indicator?.props.colorClassName).toBe(ACCENT_COLOR);
  });

  test("still shows the spinner when the video has no cover", () => {
    const { coverImage, indicator } = renderPoster({ loading: true });

    expect(coverImage).toBeNull();
    expect(indicator?.props.accessibilityLabel).toBe("视频加载中");
  });

  test("hides the spinner once the first frame is rendered", () => {
    const { coverImage, indicator } = renderPoster({
      cover: "https://example.com/cover.jpg",
      loading: false,
    });

    expect(coverImage?.props.source).toEqual({ uri: "img:https://example.com/cover.jpg" });
    expect(indicator).toBeNull();
  });
});
