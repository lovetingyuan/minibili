import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { overlayIcons } from "@/constants/overlay-icons";
import type { OverlayButton } from "../../types";

const mocks = vi.hoisted(() => ({
  setOverlayButtons: vi.fn<(buttons: OverlayButton[]) => void>(),
  setImagesList: vi.fn(),
  setCurrentImageIndex: vi.fn(),
  markFollowingDynamicsUnread: vi.fn<(mid: string | number) => void>(),
  followDisabled: true,
  hasNewDynamic: false,
  livingUps: {} as Record<string, string>,
  onSetGroups: vi.fn<(up: { mid: string | number }) => void>(),
}));

vi.mock("@react-navigation/native", () => ({ useNavigation: () => ({ navigate: vi.fn() }) }));
vi.mock("react-native", () => ({
  Alert: { alert: vi.fn() },
  Pressable: "Pressable",
  TouchableOpacity: "TouchableOpacity",
  View: "View",
}));
vi.mock("@/components/Avatar", () => ({ Avatar: "Avatar" }));
vi.mock("@/components/styled/rneui", () => ({ Text: "Text" }));
vi.mock("@/components/UpName", () => ({ default: "UpName" }));
vi.mock("@/constants/overlay-icons", () => ({
  overlayIcons: {
    setGroup: "FolderCog",
    unfollow: "UserMinus",
    markUnread: "Mail",
    viewAvatar: "CircleUserRound",
  },
}));
vi.mock("@/constants/theme", () => import("../../constants/theme"));
vi.mock("@/hooks/useFollowActions", () => ({
  useFollowActions: () => ({ disabled: mocks.followDisabled }),
}));
vi.mock("../../store", () => ({
  useStore: () => ({
    livingUps: mocks.livingUps,
    setOverlayButtons: mocks.setOverlayButtons,
    setImagesList: mocks.setImagesList,
    setCurrentImageIndex: mocks.setCurrentImageIndex,
  }),
}));
vi.mock("../../store/derives", () => ({
  useUpHasNewDynamic: () => mocks.hasNewDynamic,
}));
vi.mock("../../store/actions", () => ({
  useMarkFollowingDynamicsUnread: () => mocks.markFollowingDynamicsUnread,
}));
vi.mock("../../utils", () => ({
  getImagePixelSize: (size: number) => size,
  parseImgUrl: () => "",
}));

import FollowItem from "./FollowItem";

const item = { mid: 456, name: "UP", face: "", sign: "" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.followDisabled = true;
  mocks.hasNewDynamic = false;
  mocks.livingUps = {};
});

afterEach(() => vi.unstubAllGlobals());

function openMenu(onSetGroups?: (up: { mid: string | number }) => void) {
  const view = FollowItem({ item, onSetGroups });
  view.props.onLongPress();
  return mocks.setOverlayButtons.mock.lastCall![0];
}

test("长按菜单提供设置分组、标记未读与查看头像，关注同步完成后才提供取消关注", () => {
  expect(openMenu(mocks.onSetGroups).map((button) => button.text)).toEqual([
    "设置分组",
    "标记未读",
    "查看头像",
  ]);
  expect(openMenu(mocks.onSetGroups).map((button) => button.icon)).toEqual([
    overlayIcons.setGroup,
    overlayIcons.markUnread,
    overlayIcons.viewAvatar,
  ]);
  mocks.followDisabled = false;
  expect(openMenu(mocks.onSetGroups).map((button) => button.text)).toEqual([
    "设置分组",
    "取消关注",
    "标记未读",
    "查看头像",
  ]);
  expect(openMenu(mocks.onSetGroups).map((button) => button.icon)).toEqual([
    overlayIcons.setGroup,
    overlayIcons.unfollow,
    overlayIcons.markUnread,
    overlayIcons.viewAvatar,
  ]);
});

test("设置分组把当前 UP 交给弹窗", () => {
  const buttons = openMenu(mocks.onSetGroups);
  buttons.find((button) => button.text === "设置分组")!.onPress();
  expect(mocks.onSetGroups).toHaveBeenCalledWith(item);
});

test("查看头像在图片浮窗中打开当前 UP 头像", () => {
  const buttons = openMenu();
  buttons.find((button) => button.text === "查看头像")!.onPress();

  expect(mocks.setCurrentImageIndex).toHaveBeenCalledExactlyOnceWith(0);
  expect(mocks.setImagesList).toHaveBeenCalledExactlyOnceWith([
    { src: item.face, width: 0, height: 0, ratio: 1 },
  ]);
});

test("没有设置分组入口时只展示标记未读与查看头像", () => {
  expect(openMenu().map((button) => button.text)).toEqual(["标记未读", "查看头像"]);
});

test("特别关注的 UP 名称使用主题色并加粗", () => {
  const highlighted = FollowItem({ item, highlight: true }).props.children[1];
  expect(highlighted.props.className).toContain("font-bold");
  expect(highlighted.props.className).toContain("text-[#008AC5]");
  const plain = FollowItem({ item }).props.children[1];
  expect(plain.props.className).not.toContain("font-bold");
});

type AvatarChild = { props?: { className?: string } } | null;

function avatarArea() {
  return FollowItem({ item }).props.children[0];
}

function findDot() {
  const children = avatarArea().props.children as AvatarChild[];
  return children.find((child) => child?.props?.className?.includes("bg-[#FF6699]"));
}

test("有未读动态的 UP 头像右上角显示小红点", () => {
  expect(avatarArea().props.className).toBe("relative");
  expect(findDot()).toBeUndefined();

  mocks.hasNewDynamic = true;
  const dot = findDot();
  expect(dot?.props?.className).toContain("absolute");
  expect(dot?.props?.className).toContain("rounded-full");
  expect(dot?.props?.className).toContain("h-3.5 w-3.5");
  expect(dot?.props?.className).toContain("bg-[#FF6699]");
});

test("直播中的 UP 在直播蒙层之上仍然显示小红点", () => {
  mocks.hasNewDynamic = true;
  mocks.livingUps = { "456": "https://live.bilibili.com/25334922" };

  const children = avatarArea().props.children as AvatarChild[];
  expect(children.some((child) => child?.props?.className?.includes("bg-slate-950/60"))).toBe(
    true,
  );
  expect(findDot()).toBeDefined();
});
