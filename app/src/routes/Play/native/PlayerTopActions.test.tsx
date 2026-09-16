import React from "react";
import { describe, expect, test, vi } from "vitest";

import type { ReactElement, ReactNode } from "react";

vi.mock("react-native", () => ({
  Pressable: "Pressable",
  View: "View",
}));

vi.mock("@/components/styled/rneui", () => ({
  Icon: "Icon",
}));

vi.mock("@/constants/colors.tw", () => ({
  colors: { secondary: { text: "text-pink-500 dark:text-pink-400" } },
}));

vi.mock("@/hooks/useResolvedColor", () => ({
  default: () => "#ff6699",
}));

import PlayerTopActions from "./PlayerTopActions";

const ACCENT_COLOR = "#ff6699";

type ElementProps = {
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean };
  children?: ReactNode;
  className?: string;
  color?: string;
  name?: string;
  onPress?: () => void;
};

function expectElement(node: ReactNode): ReactElement<ElementProps> {
  if (!React.isValidElement<ElementProps>(node)) {
    throw new Error("Expected a React element");
  }
  return node;
}

function renderActions(
  options: Partial<{
    autoNextEnabled: boolean;
    backgroundPlayEnabled: boolean;
    canSendDanmaku: boolean;
    loopEnabled: boolean;
    showAutoNext: boolean;
  }> = {},
) {
  const handlers = {
    onSendDanmaku: vi.fn(),
    onToggleAutoNext: vi.fn(),
    onToggleBackgroundPlay: vi.fn(),
    onToggleLoop: vi.fn(),
  };
  const root = expectElement(
    PlayerTopActions({
      autoNextEnabled: true,
      backgroundPlayEnabled: false,
      canSendDanmaku: false,
      loopEnabled: false,
      showAutoNext: true,
      ...options,
      ...handlers,
    }),
  );
  const buttons = React.Children.toArray(root.props.children).map(expectElement);

  return { handlers, buttons };
}

function getIcon(button: ReactElement<ElementProps>) {
  return expectElement(button.props.children);
}

describe("PlayerTopActions", () => {
  test("shows loop and background play but hides auto next for a single part", () => {
    const { buttons } = renderActions({ showAutoNext: false });

    expect(buttons).toHaveLength(2);
    expect(buttons[0].props.accessibilityLabel).toBe("开启循环播放");
    expect(buttons[1].props.accessibilityLabel).toBe("开启后台播放");
    expect(getIcon(buttons[0]).props.name).toBe("repeat");
    expect(getIcon(buttons[1]).props.name).toBe("headphones");
  });

  test("places playback modes before background play and danmaku", () => {
    const { buttons } = renderActions({ canSendDanmaku: true });

    expect(buttons).toHaveLength(4);
    expect(buttons.map((button) => getIcon(button).props.name)).toEqual([
      "repeat",
      "playlist-play",
      "headphones",
      "pencil",
    ]);
  });

  test("highlights every enabled switch with the accent color", () => {
    const { buttons } = renderActions({
      autoNextEnabled: false,
      backgroundPlayEnabled: true,
      loopEnabled: true,
    });

    expect(buttons[0].props.accessibilityLabel).toBe("关闭循环播放");
    expect(buttons[0].props.accessibilityState).toEqual({ selected: true });
    expect(getIcon(buttons[0]).props.color).toBe(ACCENT_COLOR);
    expect(getIcon(buttons[1]).props.color).toBe("#ffffff");
    expect(getIcon(buttons[2]).props.color).toBe(ACCENT_COLOR);
  });

  test("calls the matching handler on press", () => {
    const { handlers, buttons } = renderActions({
      canSendDanmaku: true,
    });

    buttons[0].props.onPress?.();
    expect(handlers.onToggleLoop).toHaveBeenCalledOnce();
    buttons[1].props.onPress?.();
    expect(handlers.onToggleAutoNext).toHaveBeenCalledOnce();
    buttons[2].props.onPress?.();
    expect(handlers.onToggleBackgroundPlay).toHaveBeenCalledOnce();
    expect(handlers.onSendDanmaku).not.toHaveBeenCalled();

    buttons[3].props.onPress?.();
    expect(handlers.onSendDanmaku).toHaveBeenCalledOnce();
  });
});
