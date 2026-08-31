import { afterEach, beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  pins: { pinnedUpIds: [] as string[], disabled: false, pin: vi.fn(), unpin: vi.fn() },
  setOverlayButtons: vi.fn<(buttons: { text: string; onPress: () => void }[]) => void>(),
}));
vi.mock("@react-navigation/native", () => ({ useNavigation: () => ({ navigate: vi.fn() }) }));
vi.mock("react-native", () => ({
  Alert: { alert: vi.fn() },
  Linking: { openURL: vi.fn() },
  Pressable: "Pressable",
  TouchableOpacity: "TouchableOpacity",
  View: "View",
}));
vi.mock("@/components/styled/rneui", () => ({ Avatar: "Avatar", Badge: "Badge", Text: "Text" }));
vi.mock("@/components/UpName", () => ({ default: "UpName" }));
vi.mock("@/constants/colors.tw", () => import("../../constants/colors.tw"));
vi.mock("@/features/user-data/usePinnedUps", () => ({ usePinnedUps: () => mocks.pins }));
vi.mock("@/hooks/useFollowActions", () => ({ useFollowActions: () => ({ disabled: true }) }));
vi.mock("../../store", () => ({
  useStore: () => ({ $upUpdateMap: {}, livingUps: {}, setOverlayButtons: mocks.setOverlayButtons }),
}));
vi.mock("../../utils", () => ({ parseImgUrl: () => "", parseUrl: () => "" }));

import FollowItem from "./FollowItem";

const item = { mid: 456, name: "UP", face: "", sign: "" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("__DEV__", false);
  mocks.pins.pinnedUpIds = [];
  mocks.pins.disabled = false;
});

afterEach(() => vi.unstubAllGlobals());

function openMenu(index: number) {
  const view = FollowItem({ item, index });
  view.props.onLongPress();
  return mocks.setOverlayButtons.mock.lastCall![0];
}

test("menu actions and name styling use the synced pin setting", () => {
  const buttons = openMenu(2);
  expect(buttons.map((button) => button.text)).toContain("置顶UP");
  expect(buttons.map((button) => button.text)).not.toContain("取消置顶");
  buttons.find((button) => button.text === "置顶UP")!.onPress();
  expect(mocks.pins.pin).toHaveBeenCalledWith(456);
  mocks.pins.pinnedUpIds = ["789", "456"];
  const pinnedButtons = openMenu(1);
  expect(pinnedButtons.map((button) => button.text)).toEqual(
    expect.arrayContaining(["置顶UP", "取消置顶"]),
  );
  pinnedButtons.find((button) => button.text === "取消置顶")!.onPress();
  expect(mocks.pins.unpin).toHaveBeenCalledWith(456);
  expect(FollowItem({ item }).props.children[1].props.className).toContain("font-bold");
  mocks.pins.pinnedUpIds = [];
  expect(FollowItem({ item }).props.children[1].props.className).not.toContain("font-bold");
});

test("the first visible pin can be unpinned but does not offer moving to the top again", () => {
  mocks.pins.pinnedUpIds = ["999", "456"];
  const titles = openMenu(0).map((button) => button.text);
  expect(titles).toContain("取消置顶");
  expect(titles).not.toContain("置顶UP");
});

test("unavailable settings hide both pin actions", () => {
  mocks.pins.pinnedUpIds = ["456"];
  mocks.pins.disabled = true;
  const titles = openMenu(0).map((button) => button.text);
  expect(titles).not.toContain("置顶UP");
  expect(titles).not.toContain("取消置顶");
});
