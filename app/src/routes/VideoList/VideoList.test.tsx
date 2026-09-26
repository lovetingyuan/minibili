import React from "react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { overlayIcons } from "@/constants/overlay-icons";
import type { VideoItem as VideoItemType } from "../../api/hot-videos";
import type { FlashList } from "../../components/styled/rneui";
import type { OverlayButton } from "../../types";

const mocks = vi.hoisted(() => ({
  confirmBlock: vi.fn(),
  toggleWatchLater: vi.fn(),
  setOverlayButtons: vi.fn<(buttons: OverlayButton[]) => void>(),
  setImagesList: vi.fn(),
  setCurrentImageIndex: vi.fn(),
  setBlackTags: vi.fn(),
  alert: vi.fn(),
  navigate: vi.fn(),
  isFocused: vi.fn(() => true),
  addListener: vi.fn(),
  tabPressListener: undefined as (() => void) | undefined,
  refs: [] as { current: unknown }[],
}));
vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    default: {
      ...original,
      useRef: (current: unknown) => {
        const ref = { current };
        mocks.refs.push(ref);
        return ref;
      },
      useEffect: (effect: () => void | (() => void)) => effect(),
    },
  };
});
vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mocks.navigate,
    isFocused: mocks.isFocused,
    addListener: mocks.addListener,
  }),
}));
vi.mock("react-native", () => ({
  TouchableOpacity: () => null,
  Alert: { alert: mocks.alert },
}));
vi.mock("@/components/styled/rneui", () => ({
  FlashList: () => null,
}));
vi.mock("@/constants/overlay-icons", () => ({
  overlayIcons: {
    addWatchLater: "ClockPlus",
    removeWatchLater: "AlarmClockMinus",
    blockUp: "Ban",
    hideTagType: "EyeOff",
    share: "Share2",
    viewCover: "ImageIcon",
  },
}));
vi.mock("@/hooks/useBlockUpActions", () => ({
  useBlockUpActions: () => ({ confirmBlock: mocks.confirmBlock }),
}));
vi.mock("@/hooks/useWatchLaterActions", () => ({
  useWatchLaterActions: () => ({
    isAdded: () => false,
    isPending: () => false,
    toggle: mocks.toggleWatchLater,
  }),
}));
vi.mock("@/store", () => ({
  useStore: () => ({
    setOverlayButtons: mocks.setOverlayButtons,
    setImagesList: mocks.setImagesList,
    setCurrentImageIndex: mocks.setCurrentImageIndex,
    currentVideosCate: {},
  }),
}));
vi.mock("@/features/user-data/useUserSettings", () => ({
  useUserSettings: () => ({
    values: { $blackTags: { 游戏: "游戏" } },
    setSetting: mocks.setBlackTags,
  }),
}));
vi.mock("@/utils", () => ({
  handleShareVideo: vi.fn(),
  parseNumber: String,
}));
vi.mock("./Loading", () => ({ default: () => null }));
vi.mock("./VideoItem", () => ({ default: () => null }));

import VideoList from "./VideoList";

const video: VideoItemType = {
  aid: 1,
  bvid: "BV1",
  cid: 1,
  commentNum: 1,
  cover: "",
  danmuNum: 1,
  date: 1,
  desc: "",
  duration: 60,
  face: "",
  height: 300,
  likeNum: 1,
  mid: 456,
  name: "UP",
  playNum: 100,
  shareNum: 1,
  tag: "音乐",
  title: "视频",
  videosNum: 1,
  width: 480,
};

function getList(
  type: ComponentProps<typeof VideoList>["type"],
  videos: VideoItemType[],
  props: Pick<ComponentProps<typeof VideoList>, "onTabReselect"> = {},
) {
  const root = VideoList({ type, videos, ...props });
  if (!React.isValidElement<ComponentProps<typeof FlashList<VideoItemType>>>(root)) {
    throw new Error("Expected FlashList");
  }
  return root.props;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.tabPressListener = undefined;
  mocks.refs.length = 0;
  mocks.isFocused.mockReturnValue(true);
  mocks.addListener.mockImplementation((_event, listener: () => void) => {
    mocks.tabPressListener = listener;
    return vi.fn();
  });
});

describe("video list after replacing local UP blocking", () => {
  test.each(["Hot", "Rank", "Search"] as const)(
    "keeps deduplication and category filtering rules for %s",
    (type) => {
      const game = { ...video, bvid: "BV2", tag: "游戏" };
      const list = getList(type, [video, video, game]);
      expect(list.data).toEqual(type === "Hot" ? [video] : [video, game]);
    },
  );

  test("long-press binds blocking to that video without removing it locally", () => {
    const other = { ...video, mid: 789, name: "其他 UP", bvid: "BV2" };
    const list = getList("Hot", [video, other]);
    function longPress(item: VideoItemType, index: number) {
      const row = list.renderItem?.({ item, index, target: "Cell", extraData: undefined });
      if (!React.isValidElement<{ onLongPress: () => void }>(row)) {
        throw new Error("Expected row");
      }
      row.props.onLongPress();
    }
    longPress(video, 0);
    const buttons = mocks.setOverlayButtons.mock.calls[0][0];
    expect(buttons.some((button) => button.text === "标记观看完成")).toBe(false);
    expect(buttons[0].text).toBe("添加到稍后再看");
    expect(buttons[0].icon).toBe(overlayIcons.addWatchLater);
    expect(buttons[1].text).toBe("拉黑 UP 主「UP」");
    expect(buttons[1].icon).toBe(overlayIcons.blockUp);
    expect(buttons[2].text).toBe("不再看「音乐」类型的视频");
    expect(buttons[2].icon).toBe(overlayIcons.hideTagType);
    expect(buttons[3].icon).toBe(overlayIcons.share);
    buttons[0].onPress();
    expect(mocks.toggleWatchLater).toHaveBeenCalledExactlyOnceWith({ aid: video.aid });
    longPress(other, 1);
    buttons[1].onPress();
    expect(mocks.confirmBlock).toHaveBeenCalledExactlyOnceWith({ mid: 456, name: "UP" });
    expect(mocks.setBlackTags).not.toHaveBeenCalled();
    expect(list.data).toEqual([video, other]);
  });

  test("opens the selected video cover in the image viewer", () => {
    const list = getList("Hot", [video]);
    const row = list.renderItem?.({ item: video, index: 0, target: "Cell", extraData: undefined });
    if (!React.isValidElement<{ onLongPress: () => void }>(row)) {
      throw new Error("Expected row");
    }
    row.props.onLongPress();

    const buttons = mocks.setOverlayButtons.mock.lastCall![0];
    buttons.find((button) => button.text === "查看封面")!.onPress();

    expect(mocks.setCurrentImageIndex).toHaveBeenCalledExactlyOnceWith(0);
    expect(mocks.setImagesList).toHaveBeenCalledExactlyOnceWith([
      { src: video.cover, width: video.width, height: video.height },
    ]);
  });

  test("reselecting the focused hot tab scrolls to the top and refreshes", () => {
    const onTabReselect = vi.fn();
    getList("Hot", [video], { onTabReselect });
    const scrollToOffset = vi.fn();

    mocks.refs[0].current = { scrollToOffset };
    mocks.tabPressListener?.();

    expect(scrollToOffset).toHaveBeenCalledExactlyOnceWith({ offset: 0, animated: true });
    expect(onTabReselect).toHaveBeenCalledOnce();
  });

  test("entering the hot tab from another tab does not refresh", () => {
    const onTabReselect = vi.fn();
    mocks.isFocused.mockReturnValue(false);

    VideoList({ type: "Hot", videos: [video], onTabReselect });
    mocks.tabPressListener?.();

    expect(onTabReselect).not.toHaveBeenCalled();
  });
});
