import React from "react";
import { TouchableHighlight } from "react-native";
import type { ComponentProps } from "react";
import type { TextStyle, ViewStyle } from "react-native";

import { theme } from "@/constants/theme";

const SCREEN_INDENT = 8;

type MenuProviderCustomStyles = {
  safeArea: ViewStyle;
};

export const menuProviderCustomStyles: MenuProviderCustomStyles = {
  safeArea: {
    top: SCREEN_INDENT,
    right: SCREEN_INDENT,
    bottom: SCREEN_INDENT,
    left: SCREEN_INDENT,
  },
};

export const menuOptionsContainerStyle: ViewStyle = {
  backgroundColor: "transparent",
  elevation: 0,
  shadowOpacity: 0,
  shadowRadius: 0,
  width: undefined,
};

export const menuOptionWrapperStyle: ViewStyle = {
  alignItems: "stretch",
  backgroundColor: "transparent",
  height: 48,
  justifyContent: "center",
  maxWidth: 248,
  minWidth: 124,
  padding: 0,
};

export const menuOptionTouchableProps: Pick<
  ComponentProps<typeof TouchableHighlight>,
  "activeOpacity" | "underlayColor"
> = {
  activeOpacity: 1,
  underlayColor: "rgba(127, 127, 127, 0.16)",
};

export function MenuOptionTouchableComponent(props: ComponentProps<typeof TouchableHighlight>) {
  return React.createElement(TouchableHighlight, props);
}

export const menuSurfaceClassName = `${theme.background.overlay} ${theme.border.divider}`;

export const menuOptionTextClassName = theme.text.primary;

export const menuSurfaceStyle: ViewStyle = {
  backgroundColor: "#fff",
  borderColor: "rgba(0, 0, 0, 0.05)",
  borderRadius: 4,
  borderWidth: 1,
  elevation: 4,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
};

export const menuOptionTextStyle: TextStyle = {
  color: "#000",
  fontSize: 14,
  fontWeight: "400",
  paddingHorizontal: 16,
  textAlign: "left",
};

export type MenuThemeStyles = {
  optionText: TextStyle;
  optionsWrapper: ViewStyle;
};

export function resolveStyleColor(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function createMenuSurfaceStyle(backgroundColor?: string, borderColor?: string): ViewStyle {
  return {
    ...menuSurfaceStyle,
    ...(backgroundColor ? { backgroundColor } : {}),
    ...(borderColor ? { borderColor } : {}),
  };
}

export function createMenuOptionTextStyle(color?: string): TextStyle {
  return {
    ...menuOptionTextStyle,
    ...(color ? { color } : {}),
  };
}

export function createMenuThemeStyles(theme: {
  optionTextColor?: string;
  surfaceBackgroundColor?: string;
  surfaceBorderColor?: string;
}): MenuThemeStyles {
  return {
    optionText: createMenuOptionTextStyle(theme.optionTextColor),
    optionsWrapper: createMenuSurfaceStyle(theme.surfaceBackgroundColor, theme.surfaceBorderColor),
  };
}

export const defaultMenuThemeStyles: MenuThemeStyles = createMenuThemeStyles({});

export const menuOptionClassName = "h-12 min-w-[124px] max-w-[248px] justify-center";
