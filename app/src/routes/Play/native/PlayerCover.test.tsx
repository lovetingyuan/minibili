import React from "react";
import { describe, expect, test, vi } from "vitest";

import type { ReactElement, ReactNode } from "react";

vi.mock("react-native", () => ({
  ImageBackground: "ImageBackground",
  Pressable: "Pressable",
  Text: "Text",
  View: "View",
}));

vi.mock("@/components/styled/expo", () => ({
  Image: "Image",
}));

vi.mock("@/components/styled/rneui", () => ({
  Switch: "Switch",
}));

vi.mock("@/constants/colors.tw", () => ({
  colors: {
    gray4: { accent: "accent-gray-400 dark:accent-gray-600" },
    secondary: { accent: "accent-pink-500 dark:accent-pink-400" },
  },
}));

vi.mock("@/utils", () => ({
  getImagePixelDimensions: () => 0,
  parseDuration: () => "01:30",
  parseImgUrl: (url: string) => `img:${url}`,
}));

import PlayerCover from "./PlayerCover";

type ElementProps = {
  accessibilityLabel?: string;
  accessibilityState?: { checked?: boolean };
  children?: ReactNode;
  onPress?: () => void;
  value?: boolean;
};

function findElement(
  node: ReactNode,
  predicate: (element: ReactElement<ElementProps>) => boolean,
): ReactElement<ElementProps> | null {
  if (!React.isValidElement<ElementProps>(node)) {
    return null;
  }
  if (predicate(node)) {
    return node;
  }
  for (const child of React.Children.toArray(node.props.children)) {
    const match: ReactElement<ElementProps> | null = findElement(child, predicate);
    if (match) {
      return match;
    }
  }
  return null;
}

function renderCover(highQuality: boolean, onHighQualityChange = vi.fn(), onStart = vi.fn()) {
  const root = PlayerCover({
    cover: "https://example.com/cover.jpg",
    containerWidth: 360,
    containerHeight: 202,
    duration: 90,
    isCellular: true,
    highQuality,
    onHighQualityChange,
    onStart,
  });
  const qualityControl = findElement(
    root,
    (element) => element.props.accessibilityLabel === "高清播放",
  );
  const qualitySwitch = findElement(root, (element) => element.type === "Switch");
  const playButton = findElement(
    root,
    (element) => element.props.accessibilityLabel === "开始播放",
  );

  return { qualityControl, qualitySwitch, playButton, onHighQualityChange, onStart };
}

describe("PlayerCover", () => {
  test("shows an off switch for high quality on cellular by default", () => {
    const { qualityControl, qualitySwitch } = renderCover(false);

    expect(qualityControl?.props.accessibilityState).toEqual({ checked: false });
    expect(qualitySwitch?.props.value).toBe(false);
  });

  test("toggles high quality without starting playback", () => {
    const { qualityControl, onHighQualityChange, onStart } = renderCover(false);

    qualityControl?.props.onPress?.();

    expect(onHighQualityChange).toHaveBeenCalledWith(true);
    expect(onStart).not.toHaveBeenCalled();
  });

  test("starts playback only from the cover play target", () => {
    const { playButton, onHighQualityChange, onStart } = renderCover(false);

    playButton?.props.onPress?.();

    expect(onStart).toHaveBeenCalledOnce();
    expect(onHighQualityChange).not.toHaveBeenCalled();
  });
});
