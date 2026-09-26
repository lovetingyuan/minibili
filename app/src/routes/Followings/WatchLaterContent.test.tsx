import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { overlayIcons } from "@/constants/overlay-icons";
import type { VideoListItemInfo } from "@/types";
import type { useBilibiliWatchLater } from "@/api/useWatchLater";
import type { WatchLaterListItem } from "@/api/watch-later.types";

const mocks = vi.hoisted(() => ({
  watchLater: {} as ReturnType<typeof useBilibiliWatchLater>,
  mutate: vi.fn().mockResolvedValue(undefined),
  toggle: vi.fn(),
  setOverlayButtons: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    default: {
      ...original,
      useRef: () => ({ current: false }),
      useState: () => [false, vi.fn()],
    },
  };
});
vi.mock("@/api/useWatchLater", () => ({ useBilibiliWatchLater: () => mocks.watchLater }));
vi.mock("@/hooks/useWatchLaterActions", () => ({
  useWatchLaterActions: () => ({
    isAdded: () => false,
    isPending: () => false,
    toggle: mocks.toggle,
  }),
}));
vi.mock("@/store", () => ({ useStore: () => ({ setOverlayButtons: mocks.setOverlayButtons }) }));
vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  TouchableOpacity: "TouchableOpacity",
  View: "View",
}));
vi.mock("@/components/styled/rneui", () => ({
  Button: "Button",
  FlashList: "FlashList",
  Text: "Text",
}));
vi.mock("@/components/ThemedIcon", () => ({ ThemedIcon: "ThemedIcon" }));
vi.mock("@/components/LoginRequired", () => ({ LoginRequired: "LoginRequired" }));
vi.mock("@/features/bilibili-session/login-required", () => ({
  isLoginRequiredError: () => false,
}));
vi.mock("lucide-react-native", () => ({ Clock: "Clock" }));
vi.mock("@/constants/overlay-icons", () => ({
  overlayIcons: { removeWatchLater: "AlarmClockMinus" },
}));
vi.mock("@/components/VideoItem", () => ({ default: "VideoListItem" }));
vi.mock("@/constants/theme", () => import("../../constants/theme"));

import WatchLaterContent from "./WatchLaterContent";

type ElementProps = {
  children?: ReactNode;
  title?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  buttons?: () => { text: string; icon?: unknown; onPress: () => void }[];
  progressRatio?: number;
  video?: VideoListItemInfo;
  type?: unknown;
};

type ListProps = {
  data: WatchLaterListItem[];
  ListEmptyComponent: ReactElement;
  ListFooterComponent: ReactElement<ElementProps> | null;
  renderItem: (info: { item: WatchLaterListItem }) => ReactElement<ElementProps>;
  onRefresh: () => void;
};

function text(node: ReactNode): string {
  return React.Children.toArray(node)
    .map((child) => {
      if (React.isValidElement<{ children?: ReactNode }>(child)) {
        return text(child.props.children);
      }
      return typeof child === "string" ? child : "";
    })
    .join("");
}

function elements(node: ReactNode): ReactElement<ElementProps>[] {
  const result: ReactElement<ElementProps>[] = [];
  React.Children.forEach(node, (child) => {
    if (React.isValidElement<ElementProps>(child)) {
      result.push(child, ...elements(child.props.children));
    }
  });
  return result;
}

const video: VideoListItemInfo = {
  bvid: "BV1",
  aid: 42,
  title: "稍后再看视频",
  name: "UP",
  mid: 7,
  cover: "",
  duration: 100,
};
const item: WatchLaterListItem = {
  key: "42",
  aid: "42",
  title: "稍后再看视频",
  video,
  progressRatio: 0.5,
};

function renderList() {
  return WatchLaterContent() as ReactElement<ListProps>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mutate.mockResolvedValue(undefined);
  mocks.watchLater = {
    data: undefined,
    items: [],
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: mocks.mutate,
  } as unknown as ReturnType<typeof useBilibiliWatchLater>;
});

test("shows the loading, error and empty states", () => {
  mocks.watchLater.isLoading = true;
  expect(text(renderList().props.ListEmptyComponent)).toContain("正在加载 B站稍后再看");

  mocks.watchLater.isLoading = false;
  mocks.watchLater.error = new Error("offline");
  const failed = renderList().props.ListEmptyComponent;
  expect(text(failed)).toContain("稍后再看加载失败");
  elements(failed)
    .find((element) => element.props.title === "重试")
    ?.props.onPress?.();
  expect(mocks.mutate).toHaveBeenCalledOnce();

  mocks.watchLater.error = undefined;
  expect(text(renderList().props.ListEmptyComponent)).toContain("暂无稍后再看视频");
});

test("renders playable videos with their progress and long-press removal", () => {
  mocks.watchLater.items = [item];
  const list = renderList();
  expect(list.props.data).toEqual([item]);

  const row = list.props.renderItem({ item });
  expect(row.type).toBe("VideoListItem");
  expect(row.props).toMatchObject({ video, playCountOnCover: true, progressRatio: 0.5 });

  const [remove] = row.props.buttons?.() ?? [];
  expect(remove.text).toBe("从稍后再看移除");
  expect(remove.icon).toBe(overlayIcons.removeWatchLater);
  remove.onPress();
  expect(mocks.toggle).toHaveBeenCalledExactlyOnceWith({ aid: "42" });
});

test("keeps unavailable videos visible and removable through the overlay menu", () => {
  const unavailable: WatchLaterListItem = { ...item, video: null };
  mocks.watchLater.items = [unavailable];
  const row = renderList().props.renderItem({ item: unavailable });
  expect(text(row)).toContain("稍后再看视频");
  expect(text(row)).toContain("该视频暂不支持播放或已失效");

  row.props.onLongPress?.();
  const [remove] = mocks.setOverlayButtons.mock.calls[0][0] as {
    text: string;
    icon?: unknown;
    onPress: () => void;
  }[];
  expect(remove.text).toBe("从稍后再看移除");
  expect(remove.icon).toBe(overlayIcons.removeWatchLater);
  remove.onPress();
  expect(mocks.toggle).toHaveBeenCalledExactlyOnceWith({ aid: "42" });
});

test("refreshes through pull to refresh and exposes a footer retry", () => {
  mocks.watchLater.items = [item];
  const list = renderList();
  list.props.onRefresh();
  expect(mocks.mutate).toHaveBeenCalledOnce();
  expect(text(list.props.ListFooterComponent)).toContain("暂无更多");

  mocks.watchLater.error = new Error("offline");
  const footer = renderList().props.ListFooterComponent;
  expect(text(footer)).toContain("加载失败，已保留当前内容");
  elements(footer)
    .find((element) => element.props.title === "重试")
    ?.props.onPress?.();
  expect(mocks.mutate).toHaveBeenCalledTimes(2);
});
