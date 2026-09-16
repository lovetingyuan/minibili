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

function renderActions(options: { backgroundPlayEnabled: boolean; canSendDanmaku: boolean }) {
  const handlers = {
    onSendDanmaku: vi.fn(),
    onToggleBackgroundPlay: vi.fn(),
  };
  const root = expectElement(PlayerTopActions({ ...options, ...handlers }));
  const buttons = React.Children.toArray(root.props.children).map(expectElement);

  return { handlers, buttons };
}

function getIcon(button: ReactElement<ElementProps>) {
  return expectElement(button.props.children);
}

describe("PlayerTopActions", () => {
  test("always shows the background play switch, also without login", () => {
    const { buttons } = renderActions({ backgroundPlayEnabled: false, canSendDanmaku: false });

    expect(buttons).toHaveLength(1);
    expect(buttons[0].props.accessibilityLabel).toBe("开启后台播放");
    expect(buttons[0].props.accessibilityState).toEqual({ selected: false });
    expect(getIcon(buttons[0]).props.name).toBe("headphones");
    expect(getIcon(buttons[0]).props.color).toBe("#ffffff");
  });

  test("places the background play switch on the left of the danmaku button", () => {
    const { buttons } = renderActions({ backgroundPlayEnabled: false, canSendDanmaku: true });

    expect(buttons).toHaveLength(2);
    expect(buttons[0].props.accessibilityLabel).toBe("开启后台播放");
    expect(buttons[1].props.accessibilityLabel).toBe("发送弹幕");
    expect(getIcon(buttons[1]).props.name).toBe("pencil");
  });

  test("highlights the switch with the accent color while enabled", () => {
    const { buttons } = renderActions({ backgroundPlayEnabled: true, canSendDanmaku: true });

    expect(buttons[0].props.accessibilityLabel).toBe("关闭后台播放");
    expect(buttons[0].props.accessibilityState).toEqual({ selected: true });
    expect(getIcon(buttons[0]).props.color).toBe(ACCENT_COLOR);
  });

  test("calls the matching handler on press", () => {
    const { handlers, buttons } = renderActions({
      backgroundPlayEnabled: true,
      canSendDanmaku: true,
    });

    buttons[0].props.onPress?.();
    expect(handlers.onToggleBackgroundPlay).toHaveBeenCalledOnce();
    expect(handlers.onSendDanmaku).not.toHaveBeenCalled();

    buttons[1].props.onPress?.();
    expect(handlers.onSendDanmaku).toHaveBeenCalledOnce();
  });
});
