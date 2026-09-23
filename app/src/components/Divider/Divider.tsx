import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { clsx } from "clsx";

import { theme } from "../../constants/theme";

import type { DividerProps } from "./Divider.types";

function insetStyle(inset: boolean, insetType: DividerProps["insetType"]) {
  if (!inset) {
    return undefined;
  }
  if (insetType === "left") {
    return { marginLeft: 72 };
  }
  if (insetType === "right") {
    return { marginRight: 72 };
  }
  return { marginLeft: 72, marginRight: 72 };
}

export function Divider({
  className,
  color,
  inset = false,
  insetType = "left",
  orientation = "horizontal",
  style,
  subHeader,
  subHeaderClassName,
  subHeaderStyle,
  width = StyleSheet.hairlineWidth,
  ...viewProps
}: DividerProps) {
  const vertical = orientation === "vertical";
  const lineWidth = Number.isFinite(width) ? width : StyleSheet.hairlineWidth;
  const lineStyle = vertical
    ? {
        alignSelf: "stretch" as const,
        borderRightWidth: lineWidth,
        ...(color ? { borderRightColor: color } : {}),
      }
    : {
        borderBottomWidth: lineWidth,
        ...(color ? { borderBottomColor: color } : {}),
      };

  return (
    <>
      <View
        {...viewProps}
        className={clsx(theme.border.outline, className)}
        style={[lineStyle, insetStyle(inset, insetType), style]}
      />
      {subHeader && !vertical ? (
        <Text className={subHeaderClassName} style={[insetStyle(inset, "left"), subHeaderStyle]}>
          {subHeader}
        </Text>
      ) : null}
    </>
  );
}
