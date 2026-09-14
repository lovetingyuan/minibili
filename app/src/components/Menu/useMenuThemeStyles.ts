import { useResolveClassNames } from "uniwind";

import {
  createMenuThemeStyles,
  menuOptionTextClassName,
  menuSurfaceClassName,
  resolveStyleColor,
  type MenuThemeStyles,
} from "./Menu.styles";

export function useMenuThemeStyles(): MenuThemeStyles {
  const surfaceStyles = useResolveClassNames(menuSurfaceClassName);
  const optionTextStyles = useResolveClassNames(menuOptionTextClassName);

  return createMenuThemeStyles({
    optionTextColor: resolveStyleColor(optionTextStyles.color),
    surfaceBackgroundColor: resolveStyleColor(surfaceStyles.backgroundColor),
    surfaceBorderColor: resolveStyleColor(surfaceStyles.borderColor),
  });
}
