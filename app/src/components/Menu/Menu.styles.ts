import React from "react";
import { TouchableHighlight } from "react-native";
import type { ComponentProps } from "react";
import type { TextStyle, ViewStyle } from "react-native";

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

export const menuOptionClassName = "h-12 min-w-[124px] max-w-[248px] justify-center";
