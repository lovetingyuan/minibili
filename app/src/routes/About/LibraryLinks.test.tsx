import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mocks.navigate }),
}));
vi.mock("react-native", () => ({ View: "View" }));
vi.mock("@/components/styled/rneui", () => ({
  Icon: "Icon",
  ListItem: Object.assign("ListItem", {
    Content: "ListItemContent",
    Title: "ListItemTitle",
    Chevron: "ListItemChevron",
  }),
}));
vi.mock("@/constants/colors.tw", () => ({
  colors: { primary: { accent: "primary" } },
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

test("opens favorites and history as root stack routes", () => {
  const items = listItems(LibraryLinks());
  expect(items.map((item) => item.props.accessibilityLabel)).toEqual(["我的收藏", "观看历史"]);

  items[0].props.onPress();
  items[1].props.onPress();
  expect(mocks.navigate.mock.calls).toEqual([["Favorites"], ["History"]]);
});
