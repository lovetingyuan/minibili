import type { ReactElement } from "react";
import { expect, test, vi } from "vitest";

vi.mock("uniwind", () => ({
  useResolveClassNames: (className: string) =>
    className === "checked-color" ? { accentColor: "#fb7299" } : {},
}));
vi.mock("@react-native-community/checkbox", () => ({
  default: "NativeCheckBox",
}));
vi.mock("@shopify/flash-list", () => ({
  FlashList: "FlashList",
}));
vi.mock("@rneui/themed", () => {
  const placeholder = () => null;
  const withMembers = (members: Record<string, unknown>) => Object.assign(placeholder, members);

  return {
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
    Dialog: withMembers({ Actions: placeholder, Button: placeholder, Title: placeholder }),
    Icon: placeholder,
    ListItem: withMembers({ Accordion: placeholder }),
    Overlay: placeholder,
    Skeleton: placeholder,
    ThemeProvider: placeholder,
    createTheme: (theme: unknown) => theme,
  };
});

import { CheckBox } from "./rneui";

type NativeCheckBoxElementProps = {
  value?: boolean;
  tintColors?: { true?: string; false?: string };
};

test("将选中状态和颜色传递给原生复选框", () => {
  const pressable = CheckBox({
    checked: true,
    title: "特别关注（1）",
    checkedColorClassName: "checked-color",
    uncheckedColor: "#ffffff",
  }) as ReactElement<{ children: ReactElement<{ children: ReactElement[] }> }>;
  const nativeCheckBox = pressable.props.children.props
    .children[0] as ReactElement<NativeCheckBoxElementProps>;

  expect(nativeCheckBox.type).toBe("NativeCheckBox");
  expect(nativeCheckBox.props.value).toBe(true);
  expect(nativeCheckBox.props.tintColors).toEqual({ true: "#fb7299", false: "#ffffff" });
});
