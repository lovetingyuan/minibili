import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import type { ReactElement } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  options: undefined as Partial<NativeStackNavigationOptions> | undefined,
}));

vi.mock("@/components/styled/rneui", () => ({ Button: "Button", Icon: "Icon" }));
vi.mock("@/constants/colors.tw", () => ({ colors: { gray7: { accent: "gray7" } } }));
vi.mock("@/hooks/useUpdateNavigationOptions", () => ({
  default: (options: Partial<NativeStackNavigationOptions>) => {
    mocks.options = options;
  },
}));

import useFollowListHeader from "./FollowListHeader";

beforeEach(() => {
  mocks.options = undefined;
});

test("places the following summary and search action in the route header", () => {
  const onSearch = vi.fn();
  useFollowListHeader({ onSearch, searchVisible: false, title: "关注的UP (2/10)" });

  expect(mocks.options?.headerTitle).toBe("关注的UP (2/10)");
  const headerRight = mocks.options?.headerRight;
  expect(headerRight).toBeDefined();
  const button = headerRight?.({ canGoBack: false }) as ReactElement<{
    accessibilityLabel: string;
    onPress: () => void;
  }>;
  expect(button.props.accessibilityLabel).toBe("搜索UP主");
  button.props.onPress();
  expect(onSearch).toHaveBeenCalledOnce();
});

test("hides the header action while the inline search field is open", () => {
  useFollowListHeader({ onSearch: vi.fn(), searchVisible: true, title: "关注的UP" });
  expect(mocks.options?.headerRight).toBeUndefined();
});
