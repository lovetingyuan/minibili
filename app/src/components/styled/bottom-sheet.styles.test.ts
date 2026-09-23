import { expect, test } from "vitest";

import {
  createBottomSheetBackgroundStyle,
  createBottomSheetHandleIndicatorStyle,
  createBottomSheetThemeStyles,
  defaultBottomSheetThemeStyles,
  resolveStyleColor,
  sheetBackgroundClassName,
  sheetHandleIndicatorClassName,
} from "./bottom-sheet.styles";

test("主题类名同时覆盖浅色与深色", () => {
  expect(sheetBackgroundClassName).toContain("bg-white");
  expect(sheetBackgroundClassName).toContain("dark:bg-neutral-950");
  expect(sheetHandleIndicatorClassName).toContain("bg-neutral-300");
  expect(sheetHandleIndicatorClassName).toContain("dark:bg-neutral-700");
});

test("解析出的颜色会覆盖默认样式，缺失时保留默认值", () => {
  const styles = createBottomSheetThemeStyles({
    backgroundColor: "#101010",
    indicatorColor: "#cccccc",
  });

  expect(styles.background.backgroundColor).toBe("#101010");
  expect(styles.background.borderTopLeftRadius).toBe(28);
  expect(styles.handleIndicator.backgroundColor).toBe("#cccccc");
  expect(styles.handleIndicator.width).toBe(40);
  expect(defaultBottomSheetThemeStyles.background.backgroundColor).toBeUndefined();
  expect(createBottomSheetBackgroundStyle(undefined).backgroundColor).toBeUndefined();
  expect(createBottomSheetHandleIndicatorStyle(undefined).backgroundColor).toBeUndefined();
});

test("只在解析出颜色时覆盖默认值", () => {
  expect(resolveStyleColor("red")).toBe("red");
  expect(resolveStyleColor(undefined)).toBeUndefined();
});
