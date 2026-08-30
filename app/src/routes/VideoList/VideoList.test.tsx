import React from "react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { VideoItem as VideoItemType } from "../../api/hot-videos";
import type { FlashList } from "../../components/styled/rneui";

const mocks = vi.hoisted(() => ({
  confirmBlock: vi.fn(),
  setOverlayButtons: vi.fn<(buttons: { text: string; onPress: () => void }[]) => void>(),
  setBlackTags: vi.fn(),
  alert: vi.fn(),
}));
vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    default: {
      ...original,
      useRef: (current: unknown) => ({ current }),
      useEffect: () => {},
    },
  };
});
vi.mock("@react-navigation/native", () => ({ useNavigation: () => ({ navigate: vi.fn() }) }));
vi.mock("react-native", () => ({
  TouchableOpacity: () => null,
  Alert: { alert: mocks.alert },
  Linking: { openURL: vi.fn() },
}));
vi.mock("@/components/styled/rneui", () => ({
  FAB: () => null,
  FlashList: () => null,
  Icon: () => null,
}));
vi.mock("@/constants/colors.tw", () => ({ colors: { secondary: { accent: "accent-secondary" } } }));
vi.mock("@/hooks/useBlockUpActions", () => ({
  useBlockUpActions: () => ({ confirmBlock: mocks.confirmBlock }),
}));
vi.mock("@/store", () => ({
  useStore: () => ({
    $blackTags: { 游戏: "游戏" },
    set$blackTags: mocks.setBlackTags,
    setOverlayButtons: mocks.setOverlayButtons,
    currentVideosCate: {},
  }),
}));
vi.mock("@/utils", () => ({ handleShareVideo: vi.fn(), parseNumber: String, parseUrl: String }));
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

function getList(type: ComponentProps<typeof VideoList>["type"], videos: VideoItemType[]) {
  const root = VideoList({ type, videos });
  const list = React.Children.toArray(root.props.children)[0];
  if (!React.isValidElement<ComponentProps<typeof FlashList<VideoItemType>>>(list)) {
    throw new Error("Expected FlashList");
  }
  return list.props;
}

beforeEach(() => vi.clearAllMocks());

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
      if (!React.isValidElement<{ onLongPress: () => void }>(row)) throw new Error("Expected row");
      row.props.onLongPress();
    }
    longPress(video, 0);
    const buttons = mocks.setOverlayButtons.mock.calls[0][0];
    expect(buttons.some((button) => button.text === "标记观看完成")).toBe(false);
    expect(buttons[0].text).toBe("拉黑 UP 主「UP」");
    expect(buttons[1].text).toBe("不再看「音乐」类型的视频");
    longPress(other, 1);
    buttons[0].onPress();
    expect(mocks.confirmBlock).toHaveBeenCalledExactlyOnceWith({ mid: 456, name: "UP" });
    expect(mocks.setBlackTags).not.toHaveBeenCalled();
    expect(list.data).toEqual([video, other]);
  });
});
