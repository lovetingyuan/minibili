import React from "react";
import { describe, expect, test, vi } from "vitest";

import type { ReactElement, ReactNode } from "react";

vi.mock("react-native", () => ({
  ImageBackground: "ImageBackground",
  Pressable: "Pressable",
  Text: "Text",
  View: "View",
}));

vi.mock("@/components/styled/rneui", () => ({
  Switch: "Switch",
}));
vi.mock("@/components/ThemedIcon", () => ({ ThemedIcon: "ThemedIcon" }));
vi.mock("lucide-react-native", () => ({ Play: "Play" }));

vi.mock("@/constants/theme", () => ({
  theme: {
    background: { fillMuted: { accent: "accent-slate-400 dark:accent-slate-600" } },
    secondary: { accent: "accent-[#FF6699]" },
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
  onValueChange?: (value: boolean) => void;
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

function renderCover(
  highQuality: boolean,
  onHighQualityChange = vi.fn(),
  onStart = vi.fn(),
  isMetered = true,
) {
  const root = PlayerCover({
    duration: 90,
    isMetered,
    highQuality,
    onHighQualityChange,
    onStart,
  });
  const qualityControl = findElement(
    root,
    (element) => element.props.accessibilityLabel === "1080P 播放",
  );
  const qualitySwitch = findElement(root, (element) => element.type === "Switch");
  const qualityLabel = findElement(
    root,
    (element) => element.type === "Text" && element.props.children === "1080P",
  );
  const meteredWarning = findElement(
    root,
    (element) => element.type === "Text" && element.props.children === "播放将消耗流量",
  );
  const playButton = findElement(
    root,
    (element) => element.props.accessibilityLabel === "开始播放",
  );

  return {
    meteredWarning,
    qualityControl,
    qualitySwitch,
    qualityLabel,
    playButton,
    onHighQualityChange,
    onStart,
  };
}

describe("PlayerCover", () => {
  test("shows an off switch for high quality on metered network by default", () => {
    const { qualityControl, qualitySwitch, qualityLabel } = renderCover(false);

    expect(qualityControl?.props.accessibilityState).toEqual({ checked: false });
    expect(qualitySwitch?.props.value).toBe(false);
    expect(qualityLabel).not.toBeNull();
  });

  test("warns about mobile data and offers 1080P only on metered network", () => {
    const metered = renderCover(false);
    expect(metered.meteredWarning).not.toBeNull();
    expect(metered.qualityLabel).not.toBeNull();

    const wifi = renderCover(false, vi.fn(), vi.fn(), false);
    expect(wifi.meteredWarning).toBeNull();
    expect(wifi.qualityLabel).toBeNull();
  });

  test("toggles high quality without starting playback", () => {
    const { qualitySwitch, onHighQualityChange, onStart } = renderCover(false);

    qualitySwitch?.props.onValueChange?.(true);

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
