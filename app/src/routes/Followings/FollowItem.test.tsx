import { afterEach, beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setOverlayButtons: vi.fn<(buttons: { text: string; onPress: () => void }[]) => void>(),
  followDisabled: true,
  onSetGroups: vi.fn<(up: { mid: string | number }) => void>(),
}));

vi.mock("@react-navigation/native", () => ({ useNavigation: () => ({ navigate: vi.fn() }) }));
vi.mock("react-native", () => ({
  Alert: { alert: vi.fn() },
  Linking: { openURL: vi.fn() },
  Pressable: "Pressable",
  TouchableOpacity: "TouchableOpacity",
  View: "View",
}));
vi.mock("@/components/styled/rneui", () => ({ Avatar: "Avatar", Text: "Text" }));
vi.mock("@/components/UpName", () => ({ default: "UpName" }));
vi.mock("@/hooks/useFollowActions", () => ({
  useFollowActions: () => ({ disabled: mocks.followDisabled }),
}));
vi.mock("../../store", () => ({
  useStore: () => ({ livingUps: {}, setOverlayButtons: mocks.setOverlayButtons }),
}));
vi.mock("../../utils", () => ({
  getImagePixelSize: (size: number) => size,
  getOriginalImgUrl: () => "",
  parseImgUrl: () => "",
}));

import FollowItem from "./FollowItem";

const item = { mid: 456, name: "UP", face: "", sign: "" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.followDisabled = true;
});

afterEach(() => vi.unstubAllGlobals());

function openMenu(onSetGroups?: (up: { mid: string | number }) => void) {
  const view = FollowItem({ item, onSetGroups });
  view.props.onLongPress();
  return mocks.setOverlayButtons.mock.lastCall![0];
}

test("长按菜单提供设置分组与查看头像，关注同步完成后才提供取消关注", () => {
  expect(openMenu(mocks.onSetGroups).map((button) => button.text)).toEqual([
    "设置分组",
    "查看头像",
  ]);
  mocks.followDisabled = false;
  expect(openMenu(mocks.onSetGroups).map((button) => button.text)).toEqual([
    "设置分组",
    "取消关注",
    "查看头像",
  ]);
});

test("设置分组把当前 UP 交给弹窗", () => {
  const buttons = openMenu(mocks.onSetGroups);
  buttons.find((button) => button.text === "设置分组")!.onPress();
  expect(mocks.onSetGroups).toHaveBeenCalledWith(item);
});

test("没有设置分组入口时只展示关注与头像操作", () => {
  expect(openMenu().map((button) => button.text)).toEqual(["查看头像"]);
});
