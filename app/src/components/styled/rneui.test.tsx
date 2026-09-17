import { expect, test, vi } from "vitest";
import type { ReactElement } from "react";

vi.mock("uniwind", () => ({
  useResolveClassNames: () => ({}),
}));
vi.mock("@shopify/flash-list", () => ({
  FlashList: "FlashList",
}));
vi.mock("@rneui/themed", () => {
  const placeholder = () => null;
  const withMembers = (members: Record<string, unknown>) => Object.assign(placeholder, members);

  return {
    Avatar: placeholder,
    Badge: placeholder,
    BottomSheet: placeholder,
    Button: placeholder,
    Card: withMembers({
      Divider: placeholder,
      FeaturedSubtitle: placeholder,
      FeaturedTitle: placeholder,
      Image: placeholder,
      Title: placeholder,
    }),
    CheckBox: "RNEUICheckBox",
    Chip: placeholder,
    Dialog: withMembers({ Actions: placeholder, Button: placeholder, Title: placeholder }),
    Divider: placeholder,
    Icon: placeholder,
    ListItem: withMembers({ Accordion: placeholder }),
    Overlay: placeholder,
    Skeleton: placeholder,
    Switch: placeholder,
    Text: placeholder,
    ThemeProvider: placeholder,
    createTheme: (theme: unknown) => theme,
  };
});

import { CheckBox } from "./rneui";

type CheckBoxElementProps = {
  iconType?: string;
  checkedIcon?: string;
  uncheckedIcon?: string;
};

test("默认使用已安装的 material 图标，避免复选框图标渲染不出来", () => {
  const element = CheckBox({
    checked: false,
    title: "特别关注（1）",
  }) as ReactElement<CheckBoxElementProps>;

  expect(element.props.iconType).toBe("material");
  expect(element.props.checkedIcon).toBe("check-box");
  expect(element.props.uncheckedIcon).toBe("check-box-outline-blank");
});

test("调用方传入的图标配置优先", () => {
  const element = CheckBox({
    checked: true,
    iconType: "ionicon",
    checkedIcon: "heart",
    uncheckedIcon: "heart-outline",
  }) as ReactElement<CheckBoxElementProps>;

  expect(element.props.iconType).toBe("ionicon");
  expect(element.props.checkedIcon).toBe("heart");
  expect(element.props.uncheckedIcon).toBe("heart-outline");
});
