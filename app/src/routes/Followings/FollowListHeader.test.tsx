import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import type { HeaderSearchBarOptions, HeaderSearchBarRef } from "@react-navigation/elements";
import type { RefObject } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  backHandler: undefined as (() => boolean) | undefined,
  options: undefined as Partial<BottomTabNavigationOptions> | undefined,
}));

vi.mock("@react-native-community/hooks", () => ({
  useBackHandler: (handler: () => boolean) => {
    mocks.backHandler = handler;
  },
}));
vi.mock("@react-navigation/native", () => ({ useIsFocused: () => true }));
vi.mock("@/hooks/useUpdateNavigationOptions", () => ({
  default: (options: Partial<BottomTabNavigationOptions>) => {
    mocks.options = options;
  },
}));

import useFollowListHeader from "./FollowListHeader";

beforeEach(() => {
  mocks.backHandler = undefined;
  mocks.options = undefined;
});

test("places the following summary and native search field in the route header", () => {
  const onChangeText = vi.fn();
  const onClose = vi.fn();
  const onSubmit = vi.fn();
  const cancelSearch = vi.fn();
  const searchBarRef: RefObject<HeaderSearchBarRef | null> = {
    current: { blur: vi.fn(), cancelSearch, clearText: vi.fn(), focus: vi.fn(), setText: vi.fn() },
  };
  useFollowListHeader({
    onChangeText,
    onClose,
    onSubmit,
    searchActive: true,
    searchBarRef,
    title: "关注的UP (2/10)",
  });

  expect(mocks.options?.headerTitle).toBe("关注的UP (2/10)");
  expect(mocks.options).toHaveProperty("headerRight", undefined);
  const searchOptions = mocks.options?.headerSearchBarOptions;
  expect(searchOptions?.ref).toBe(searchBarRef);
  expect(searchOptions?.placeholder).toBe("搜索UP主");
  expect(searchOptions?.cancelButtonText).toBe("取消");

  const changeEvent = {
    nativeEvent: { text: "新的UP" },
  } as Parameters<NonNullable<HeaderSearchBarOptions["onChangeText"]>>[0];
  searchOptions?.onChangeText?.(changeEvent);
  expect(onChangeText).toHaveBeenCalledWith("新的UP");

  const submitEvent = {
    nativeEvent: { text: "新的UP" },
  } as Parameters<NonNullable<HeaderSearchBarOptions["onSubmitEditing"]>>[0];
  searchOptions?.onSubmitEditing?.(submitEvent);
  expect(onSubmit).toHaveBeenCalledWith("新的UP");

  searchOptions?.onClose?.();
  expect(onClose).toHaveBeenCalledOnce();

  expect(mocks.backHandler?.()).toBe(true);
  expect(cancelSearch).toHaveBeenCalledOnce();
});

test("lets navigation handle back when search results are not active", () => {
  const cancelSearch = vi.fn();
  useFollowListHeader({
    onChangeText: vi.fn(),
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    searchActive: false,
    searchBarRef: {
      current: {
        blur: vi.fn(),
        cancelSearch,
        clearText: vi.fn(),
        focus: vi.fn(),
        setText: vi.fn(),
      },
    },
    title: "关注的UP",
  });

  expect(mocks.backHandler?.()).toBe(false);
  expect(cancelSearch).not.toHaveBeenCalled();
});
