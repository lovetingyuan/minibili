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
vi.mock("@/components/ThemedIcon", () => ({ ThemedIcon: "ThemedIcon" }));
vi.mock("lucide-react-native", () => ({ ChevronDown: "ChevronDown", ChevronUp: "ChevronUp" }));

vi.mock("@/components/UpName", () => ({
  default: "UpName",
}));

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ push: () => {} }),
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
  test("clamps a long description to four lines with the expand button on the last line", () => {
    const onToggle = vi.fn();
    const root = expectElement(
      VideoDescriptionView({
        text: longDescription,
        collapsed: true,
        onToggle,
      }),
    );
    const [text, toggle] = getChildren(root);

    expect(VIDEO_DESCRIPTION_COLLAPSED_LINES).toBe(4);
    expect(text.props.numberOfLines).toBe(VIDEO_DESCRIPTION_COLLAPSED_LINES);
    expect(text.props.children).toBe(longDescription);
    expect(root.props.className).toContain("relative");
    // 折叠时按钮绝对定位到最后一行行尾，而不是单独占一行
    expect(toggle.props.className).toContain("absolute");
    expect(toggle.props.className).toContain("bottom-2.5");
    expect(toggle.props.className).not.toContain("self-end");
    // 盖住底下的文字，避免和“显示更多”重叠
    expect(toggle.props.className).toContain("bg-neutral-50");
    expect(toggle.props.accessibilityLabel).toBe("展开完整简介");
    expect(getChildren(toggle)[0].props.children).toBe("显示更多");

    toggle.props.onPress?.();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test("shows the full description with a collapse button in its own row once expanded", () => {
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
    expect(toggle.props.className).not.toContain("absolute");
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
