import React from "react";
import { describe, expect, test, vi } from "vitest";

import type { ReactElement, ReactNode } from "react";

vi.mock("react-native", () => ({
  Pressable: "Pressable",
  View: "View",
}));

vi.mock("@/components/styled/rneui", () => ({
  Icon: "Icon",
  Text: "Text",
}));

vi.mock("@/constants/colors.tw", () => ({
  colors: {
    primary: {
      accent: "accent-primary",
      text: "text-primary",
    },
    gray6: {
      accent: "accent-gray6",
    },
    gray7: {
      text: "text-gray7",
    },
    gray8: {
      text: "text-gray8",
    },
  },
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
};

const longDescription = "字".repeat(VIDEO_DESCRIPTION_COLLAPSE_MAX_CHARS + 1);

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
  test("clamps a long description to five lines with the expand button below the text", () => {
    const onToggle = vi.fn();
    const root = expectElement(
      VideoDescriptionView({
        text: longDescription,
        collapsed: true,
        onToggle,
      }),
    );
    const [text, toggle] = getChildren(root);

    expect(text.props.numberOfLines).toBe(VIDEO_DESCRIPTION_COLLAPSED_LINES);
    expect(text.props.children).toBe(longDescription);
    expect(toggle.props.className).toContain("self-end");
    expect(toggle.props.className).not.toContain("absolute");
    expect(toggle.props.accessibilityLabel).toBe("展开完整简介");
    expect(getChildren(toggle)[0].props.children).toBe("显示更多");

    toggle.props.onPress?.();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test("shows the full description with a collapse button once expanded", () => {
    const root = expectElement(
      VideoDescriptionView({
        text: longDescription,
        collapsed: false,
        onToggle: vi.fn(),
      }),
    );
    const [text, toggle] = getChildren(root);

    expect(text.props.numberOfLines).toBeUndefined();
    expect(text.props.children).toBe(longDescription);
    expect(toggle.props.accessibilityLabel).toBe("收起简介");
    expect(toggle.props.className).toContain("self-end");
    expect(getChildren(toggle)[0].props.children).toBe("收起");
  });

  test("keeps short descriptions uncollapsed without any button", () => {
    const root = expectElement(VideoDescriptionView({ text: "短简介", collapsed: true }));
    const children = getChildren(root);

    expect(children).toHaveLength(1);
    expect(children[0].props.numberOfLines).toBeUndefined();
    expect(children[0].props.children).toBe("短简介");
  });

  test("renders nothing when there is no description", () => {
    expect(VideoDescriptionView({ text: "", collapsed: true })).toBeNull();
  });
});
