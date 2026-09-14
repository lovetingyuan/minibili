import React from "react";
import { describe, expect, test, vi } from "vitest";

import type { ReactElement, ReactNode } from "react";

vi.mock("react-native", () => ({
  Pressable: "Pressable",
  View: "View",
}));

vi.mock("@/components/styled/rneui", () => ({
  Text: "Text",
}));

vi.mock("@/constants/colors.tw", () => ({
  colors: {
    primary: {
      text: "text-primary",
    },
  },
}));

vi.mock("uniwind", () => ({
  useResolveClassNames: () => ({ backgroundColor: "#ffffff" }),
}));

import {
  VIDEO_DESCRIPTION_COLLAPSE_MAX_CHARS,
  VIDEO_DESCRIPTION_COLLAPSED_LINES,
} from "./description";
import { VideoDescriptionView } from "./VideoDescription";

type ElementProps = {
  accessibilityLabel?: string;
  children?: ReactNode;
  className?: string;
  numberOfLines?: number;
  onPress?: () => void;
  style?: {
    experimental_backgroundImage?: ReadonlyArray<{
      colorStops: ReadonlyArray<{ color: string }>;
      direction?: string;
      type: string;
    }>;
  };
};

const longDescription = "字".repeat(VIDEO_DESCRIPTION_COLLAPSE_MAX_CHARS + 1);
const surfaceColor = "#ffffff";

function expectElement(node: ReactNode): ReactElement<ElementProps> {
  if (!React.isValidElement<ElementProps>(node)) {
    throw new Error("Expected a React element");
  }

  return node;
}

function getChildren(element: ReactElement<ElementProps>) {
  return React.Children.toArray(element.props.children).map(expectElement);
}

describe("VideoDescriptionView", () => {
  test("clamps a long description to five lines with a fading expand button on the last line", () => {
    const onToggle = vi.fn();
    const root = expectElement(
      VideoDescriptionView({
        text: longDescription,
        collapsed: true,
        onToggle,
        surfaceColor,
      }),
    );
    const [wrapper] = getChildren(root);
    const [text, overlay] = getChildren(wrapper);

    expect(text.props.numberOfLines).toBe(VIDEO_DESCRIPTION_COLLAPSED_LINES);
    expect(text.props.children).toBe(longDescription);
    expect(overlay.props.className).toContain("absolute");
    expect(overlay.props.className).toContain("bottom-0");
    expect(overlay.props.className).toContain("right-0");

    const [fade, toggle] = getChildren(overlay);
    expect(fade.props.style?.experimental_backgroundImage).toEqual([
      {
        type: "linear-gradient",
        direction: "to right",
        colorStops: [{ color: "transparent" }, { color: surfaceColor }],
      },
    ]);
    expect(toggle.props.accessibilityLabel).toBe("展开完整简介");
    expect(getChildren(toggle)[0].props.children).toBe("显示更多");

    toggle.props.onPress?.();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test("skips the fade when the surface color is unknown", () => {
    const root = expectElement(
      VideoDescriptionView({ text: longDescription, collapsed: true, onToggle: vi.fn() }),
    );
    const [text, overlay] = getChildren(expectElement(getChildren(root)[0]));
    const [fade] = getChildren(overlay);

    expect(text.props.numberOfLines).toBe(VIDEO_DESCRIPTION_COLLAPSED_LINES);
    expect(fade.props.style).toBeUndefined();
  });

  test("shows the full description with a collapse button once expanded", () => {
    const root = expectElement(
      VideoDescriptionView({
        text: longDescription,
        collapsed: false,
        onToggle: vi.fn(),
        surfaceColor,
      }),
    );
    const [wrapper, toggle] = getChildren(root);
    const [text] = getChildren(wrapper);

    expect(text.props.numberOfLines).toBeUndefined();
    expect(text.props.children).toBe(longDescription);
    expect(toggle.props.accessibilityLabel).toBe("收起简介");
    expect(toggle.props.className).toContain("self-end");
    expect(getChildren(toggle)[0].props.children).toBe("收起");
  });

  test("keeps short descriptions uncollapsed without any button", () => {
    const root = expectElement(
      VideoDescriptionView({ text: "短简介", collapsed: true, surfaceColor }),
    );
    const [wrapper] = getChildren(root);
    const children = getChildren(wrapper);

    expect(children).toHaveLength(1);
    expect(children[0].props.numberOfLines).toBeUndefined();
    expect(children[0].props.children).toBe("短简介");
  });

  test("renders nothing when there is no description", () => {
    expect(VideoDescriptionView({ text: "", collapsed: true, surfaceColor })).toBeNull();
  });
});
