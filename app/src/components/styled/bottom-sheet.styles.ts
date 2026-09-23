import type { ViewStyle } from "react-native";

/** sheet 面板背景，与两处 sheet 内容区原本的配色保持一致 */
export const sheetBackgroundClassName = "bg-white dark:bg-neutral-950";
/** 内置把手的指示条，与原本自绘把手配色保持一致 */
export const sheetHandleIndicatorClassName = "bg-neutral-300 dark:bg-neutral-700";

const SHEET_RADIUS = 28;
const HANDLE_INDICATOR_WIDTH = 40;
const HANDLE_INDICATOR_HEIGHT = 4;

const sheetHandleStyle: ViewStyle = {
  // 原本自绘把手为 pt-2.5 + 4px 指示条 + pb-1
  paddingTop: 10,
  paddingBottom: 4,
};

const sheetBackgroundStyle: ViewStyle = {
  borderTopLeftRadius: SHEET_RADIUS,
  borderTopRightRadius: SHEET_RADIUS,
};

const sheetHandleIndicatorStyle: ViewStyle = {
  alignSelf: "center",
  borderRadius: 999,
  height: HANDLE_INDICATOR_HEIGHT,
  width: HANDLE_INDICATOR_WIDTH,
};

export type BottomSheetThemeStyles = {
  background: ViewStyle;
  handle: ViewStyle;
  handleIndicator: ViewStyle;
};

export function resolveStyleColor(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function createBottomSheetBackgroundStyle(backgroundColor?: string): ViewStyle {
  return {
    ...sheetBackgroundStyle,
    ...(backgroundColor ? { backgroundColor } : {}),
  };
}

export function createBottomSheetHandleIndicatorStyle(indicatorColor?: string): ViewStyle {
  return {
    ...sheetHandleIndicatorStyle,
    ...(indicatorColor ? { backgroundColor: indicatorColor } : {}),
  };
}

export function createBottomSheetThemeStyles(theme: {
  backgroundColor?: string;
  indicatorColor?: string;
}): BottomSheetThemeStyles {
  return {
    background: createBottomSheetBackgroundStyle(theme.backgroundColor),
    handle: sheetHandleStyle,
    handleIndicator: createBottomSheetHandleIndicatorStyle(theme.indicatorColor),
  };
}

export const defaultBottomSheetThemeStyles: BottomSheetThemeStyles = createBottomSheetThemeStyles(
  {},
);
