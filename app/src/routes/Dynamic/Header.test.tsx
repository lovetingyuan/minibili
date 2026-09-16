import React from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clipboardSetStringAsync: vi.fn(async () => {}),
  follow: vi.fn(async () => {}),
  followedUps: {} as Record<string, { mid: number; name: string; face: string; sign: string }>,
  livingUrl: "",
  menuTriggerIconButtonStyles: { TriggerTouchableComponent: "IconButton" } as Record<
    string,
    unknown
  >,
  navigate: vi.fn(),
  relation: { data: { follower: 12345 } } as { data: { follower: number } | undefined },
  setCurrentImageIndex: vi.fn(),
  setImagesList: vi.fn(),
  showToast: vi.fn(),
  shareUp: vi.fn(),
  state: { disabled: false, isPreparing: false, pendingMid: "" },
  unfollow: vi.fn(async () => {}),
  route: {
    params: {
      user: {
        face: "https://i0.hdslb.com/bfs/face/avatar.jpg",
        mid: 100,
        name: "测试UP",
        sign: "签名",
      },
    },
  },
}));

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    default: {
      ...original,
      useState: (initialState: unknown) => [initialState, vi.fn()],
    },
  };
});
vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mocks.navigate }),
  useRoute: () => mocks.route,
}));
vi.mock("react-native", () => ({ Pressable: "Pressable", View: "View" }));
vi.mock("@/components/Menu", () => ({
  Menu: "Menu",
  MenuOption: "MenuOption",
  MenuOptions: "MenuOptions",
  MenuTrigger: "MenuTrigger",
  menuTriggerIconButtonStyles: mocks.menuTriggerIconButtonStyles,
}));
vi.mock("@/components/UpName", () => ({ default: "UpName" }));
vi.mock("@/components/styled/rneui", () => ({ Avatar: "Avatar", Icon: "Icon", Text: "Text" }));
vi.mock("@/constants/colors.tw", () => import("../../constants/colors.tw"));
vi.mock("@/hooks/useFollowActions", () => ({
  useFollowActions: () => ({
    ...mocks.state,
    follow: mocks.follow,
    unfollow: mocks.unfollow,
  }),
}));
vi.mock("@/store/derives", () => ({ useFollowedUpsMap: () => mocks.followedUps }));
vi.mock("expo-clipboard", () => ({ setStringAsync: mocks.clipboardSetStringAsync }));
vi.mock("../../api/living-info", () => ({ useLivingInfo: () => ({ livingUrl: mocks.livingUrl }) }));
vi.mock("../../api/user-info", () => ({ useUserInfo: () => ({ data: undefined }) }));
vi.mock("../../api/user-relation", () => ({ useUserRelation: () => mocks.relation }));
vi.mock("../../store", () => ({
  useStore: () => ({
    setCurrentImageIndex: mocks.setCurrentImageIndex,
    setImagesList: mocks.setImagesList,
  }),
}));
vi.mock("../../utils", () => ({
  getImagePixelSize: (size: number) => size,
  handleShareUp: mocks.shareUp,
  parseImgUrl: String,
  parseNumber: String,
  showToast: mocks.showToast,
}));

import { headerRight, headerTitle } from "./Header";

type ElementProps = {
  accessibilityLabel?: string;
  accessibilityRole?: string;
  children?: ReactNode;
  className?: string;
  customStyles?: unknown;
  disabled?: boolean;
  ellipsizeMode?: string;
  numberOfLines?: number;
  onPress?: () => void;
  onSelect?: () => void;
  text?: string;
};

type TestElement = ReactElement<ElementProps>;

function renderFunction(element: ReactElement): TestElement {
  if (typeof element.type !== "function") {
    throw new Error("Expected a function component");
  }
  const Component = element.type as (props: typeof element.props) => TestElement;
  return Component(element.props);
}

function childElements(element: TestElement): TestElement[] {
  return React.Children.toArray(element.props.children).filter((child) =>
    React.isValidElement(child),
  ) as unknown as TestElement[];
}

function menuOptions() {
  const header = renderFunction(headerRight());
  const [menu] = childElements(header);
  const [, options] = childElements(menu);
  return childElements(options);
}

function headerTrigger() {
  const header = renderFunction(headerRight());
  const [menu] = childElements(header);
  const [trigger] = childElements(menu);
  return trigger;
}

function headerTitleChildren() {
  const header = renderFunction(headerTitle());
  return childElements(header);
}

function user() {
  return mocks.route.params.user;
}

describe("UP 主动态页头部菜单", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.followedUps = {};
    mocks.state = { disabled: false, isPreparing: false, pendingMid: "" };
    mocks.livingUrl = "";
  });

  test("只保留关注切换和分享两个入口", () => {
    const options = menuOptions();

    expect(options.map((option) => option.props.text)).toEqual(["关注UP", "分享UP"]);
  });

  test("右上角三个点渲染成图标按钮", () => {
    const trigger = headerTrigger();

    expect(trigger.type).toBe("MenuTrigger");
    expect(trigger.props.accessibilityRole).toBe("button");
    expect(trigger.props.accessibilityLabel).toBe("更多操作");
    expect(trigger.props.customStyles).toBe(mocks.menuTriggerIconButtonStyles);
    expect(trigger.props.onPress).toBeTypeOf("function");
  });

  test("未关注时点击第一项关注 UP", () => {
    const [followOption] = menuOptions();

    expect(followOption.props.disabled).toBe(false);
    followOption.props.onSelect?.();

    expect(mocks.follow).toHaveBeenCalledWith(user());
    expect(mocks.unfollow).not.toHaveBeenCalled();
  });

  test("已关注时第一项变为取消关注并直接取消", () => {
    mocks.followedUps = { "100": user() };
    const [followOption] = menuOptions();

    expect(followOption.props.text).toBe("取消关注");
    followOption.props.onSelect?.();

    expect(mocks.unfollow).toHaveBeenCalledWith(user());
    expect(mocks.follow).not.toHaveBeenCalled();
  });

  test("同步和关注处理中保持禁用与提示文案", () => {
    mocks.state = { disabled: true, isPreparing: true, pendingMid: "" };
    expect(menuOptions()[0].props).toMatchObject({
      disabled: true,
      text: "同步关注列表中",
    });

    mocks.state = { disabled: true, isPreparing: false, pendingMid: "100" };
    expect(menuOptions()[0].props).toMatchObject({
      disabled: true,
      text: "关注处理中",
    });
  });

  test("分享 UP 仍然可用", () => {
    const [, shareOption] = menuOptions();

    shareOption.props.onSelect?.();

    expect(mocks.shareUp).toHaveBeenCalledWith(user().name, user().mid, user().sign);
  });
});

describe("UP 主动态页头部标题", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.followedUps = {};
    mocks.state = { disabled: false, isPreparing: false, pendingMid: "" };
    mocks.livingUrl = "";
  });

  test("名称与粉丝数保持单行且名称超长时截断", () => {
    const [avatar, nameRow] = headerTitleChildren();
    const [name, fans] = childElements(nameRow);

    expect(avatar.type).toBe("View");
    expect(nameRow.props.className).toContain("flex-1");
    expect(nameRow.props.className).not.toContain("flex-wrap");
    expect(name.props.className).toContain("shrink");
    expect(name.props.numberOfLines).toBe(1);
    expect(name.props.ellipsizeMode).toBe("tail");
    expect(fans.props.className).toContain("shrink-0");
  });

  test("点击名称复制并提示", async () => {
    const [, nameRow] = headerTitleChildren();
    const [name] = childElements(nameRow);

    name.props.onPress?.();
    await Promise.resolve();

    expect(mocks.clipboardSetStringAsync).toHaveBeenCalledWith(user().name);
    expect(mocks.showToast).toHaveBeenCalledWith("已复制用户名");
  });

  test("点击头像打开图片浏览组件", () => {
    const [avatar] = headerTitleChildren();
    const [avatarImage] = childElements(avatar);

    avatarImage.props.onPress?.();

    expect(mocks.setImagesList).toHaveBeenCalledWith([
      { src: user().face, width: 0, height: 0, ratio: 1 },
    ]);
    expect(mocks.setCurrentImageIndex).toHaveBeenCalledWith(0);
  });

  test("直播中的蒙层仍进入直播间", () => {
    mocks.livingUrl = "https://live.bilibili.com/1";
    const [avatar] = headerTitleChildren();
    const [, livingOverlay] = childElements(avatar);

    livingOverlay.props.onPress?.();

    expect(mocks.navigate).toHaveBeenCalledWith("Living", {
      title: `${user().name}的直播间`,
      user: { mid: user().mid, name: user().name },
      url: mocks.livingUrl,
    });
  });
});
