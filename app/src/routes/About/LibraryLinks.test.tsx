import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mocks.navigate }),
}));
vi.mock("react-native", () => ({ Pressable: "Pressable", Text: "Text", View: "View" }));
vi.mock("@/components/ThemedIcon", () => ({ ThemedIcon: "ThemedIcon" }));
vi.mock("lucide-react-native", () => ({
  ChevronRight: "ChevronRight",
  Clock: "Clock",
  History: "History",
  Star: "Star",
}));
vi.mock("@/constants/theme", () => ({
  theme: {
    text: { primary: "black" },
    icon: { muted: "gray4" },
    primary: { accent: "primary" },
  },
}));

import LibraryLinks from "./LibraryLinks";

function listItems(node: ReactNode) {
  const result: ReactElement<{ accessibilityLabel: string; onPress: () => void }>[] = [];
  React.Children.forEach(node, (child) => {
    if (React.isValidElement<{ children?: ReactNode; accessibilityLabel?: string }>(child)) {
      if (child.props.accessibilityLabel) {
        result.push(child as ReactElement<{ accessibilityLabel: string; onPress: () => void }>);
      }
      result.push(...listItems(child.props.children));
    }
  });
  return result;
}

beforeEach(() => vi.clearAllMocks());

test("opens favorites, history and watch later as root stack routes", () => {
  const items = listItems(LibraryLinks());
  expect(items.map((item) => item.props.accessibilityLabel)).toEqual([
    "我的收藏",
    "观看历史",
    "稍后再看",
  ]);

  items[0].props.onPress();
  items[1].props.onPress();
  items[2].props.onPress();
  expect(mocks.navigate.mock.calls).toEqual([["Favorites"], ["History"], ["WatchLater"]]);
});
