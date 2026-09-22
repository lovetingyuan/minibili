import React from "react";
import { describe, expect, test, vi } from "vitest";

import type { ReactElement, ReactNode } from "react";

vi.mock("react-native", () => ({
  Pressable: "Pressable",
  Text: "Text",
  View: "View",
}));

vi.mock("@/components/Menu", () => ({
  Menu: "Menu",
  MenuOption: "MenuOption",
  MenuOptions: "MenuOptions",
  MenuTrigger: "MenuTrigger",
}));

vi.mock("@/components/ThemedIcon", () => ({ ThemedIcon: "ThemedIcon" }));
vi.mock("lucide-react-native", () => ({
  Check: "Check",
  ChevronDown: "ChevronDown",
  ChevronUp: "ChevronUp",
  Headphones: "Headphones",
  ListVideo: "ListVideo",
  Pencil: "Pencil",
  Repeat2: "Repeat2",
}));

vi.mock("@/constants/colors.tw", () => ({
  colors: {
    black: { text: "text-zinc-800 dark:text-neutral-200" },
    secondary: { text: "text-pink-500 dark:text-pink-400" },
  },
}));

vi.mock("@/hooks/useResolvedColor", () => ({
  default: () => "#ff6699",
}));

import PlayerTopActions from "./PlayerTopActions";

const ACCENT_COLOR = "#ff6699";

type ElementProps = {
  accessibilityLabel?: string;
  accessibilityState?: { expanded?: boolean; selected?: boolean };
  children?: ReactNode;
  className?: string;
  color?: string;
  icon?: string;
  name?: string;
  onPress?: () => void;
  onSelect?: () => void;
  opened?: boolean;
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
    playbackRateMenuOpen: boolean;
  }> = {},
) {
  const handlers = {
    onClosePlaybackRateMenu: vi.fn(),
    onPlaybackRateChange: vi.fn(),
    onSendDanmaku: vi.fn(),
    onTogglePlaybackRateMenu: vi.fn(),
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
      playbackRate: 1,
      playbackRateMenuOpen: false,
      showAutoNext: true,
      ...options,
      ...handlers,
    }),
  );
  const children = React.Children.toArray(root.props.children).map(expectElement);
  const rateMenu = children[0];
  const buttons = children.slice(1);

  return { handlers, buttons, rateMenu };
}

function getIcon(button: ReactElement<ElementProps>) {
  return expectElement(button.props.children);
}

describe("PlayerTopActions", () => {
  test("shows every supported playback rate and marks the current one", () => {
    const { rateMenu } = renderActions({ playbackRateMenuOpen: true });
    const [trigger, options] = React.Children.toArray(rateMenu.props.children).map(expectElement);
    const rateOptions = React.Children.toArray(options.props.children).map(expectElement);

    expect(rateMenu.props.opened).toBe(true);
    expect(trigger.props.accessibilityLabel).toBe("播放速度，当前 1x，列表已展开");
    expect(rateOptions.map((option) => option.props.accessibilityLabel)).toEqual([
      "0.5x",
      "0.8x",
      "1x，当前速度",
      "1.5x",
      "2x",
      "3x",
    ]);
  });

  test("opens the rate menu and selects a playback rate", () => {
    const { handlers, rateMenu } = renderActions();
    const [trigger, options] = React.Children.toArray(rateMenu.props.children).map(expectElement);
    const rateOptions = React.Children.toArray(options.props.children).map(expectElement);

    trigger.props.onPress?.();
    expect(handlers.onTogglePlaybackRateMenu).toHaveBeenCalledOnce();
    rateOptions[4].props.onSelect?.();
    expect(handlers.onPlaybackRateChange).toHaveBeenCalledWith(2);
  });

  test("shows loop and background play but hides auto next for a single part", () => {
    const { buttons } = renderActions({ showAutoNext: false });

    expect(buttons).toHaveLength(2);
    expect(buttons[0].props.accessibilityLabel).toBe("开启循环播放");
    expect(buttons[1].props.accessibilityLabel).toBe("开启后台播放");
    expect(getIcon(buttons[0]).props.icon).toBe("Repeat2");
    expect(getIcon(buttons[1]).props.icon).toBe("Headphones");
  });

  test("places playback modes before background play and danmaku", () => {
    const { buttons } = renderActions({ canSendDanmaku: true });

    expect(buttons).toHaveLength(4);
    expect(buttons.map((button) => getIcon(button).props.icon)).toEqual([
      "Repeat2",
      "ListVideo",
      "Headphones",
      "Pencil",
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
