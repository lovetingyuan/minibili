import { useResolveClassNames } from "uniwind";

import {
  createBottomSheetThemeStyles,
  resolveStyleColor,
  sheetBackgroundClassName,
  sheetHandleIndicatorClassName,
  type BottomSheetThemeStyles,
} from "./bottom-sheet.styles";

export default function useBottomSheetThemeStyles(): BottomSheetThemeStyles {
  const backgroundStyles = useResolveClassNames(sheetBackgroundClassName);
  const indicatorStyles = useResolveClassNames(sheetHandleIndicatorClassName);

  return createBottomSheetThemeStyles({
    backgroundColor: resolveStyleColor(backgroundStyles.backgroundColor),
    indicatorColor: resolveStyleColor(indicatorStyles.backgroundColor),
  });
}
