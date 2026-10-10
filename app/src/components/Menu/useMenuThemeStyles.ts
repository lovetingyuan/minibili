import { useResolveClassNames } from "uniwind";
import useResolvedColor from "@/hooks/useResolvedColor";

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
  const shadowColor = useResolvedColor("accent-shadow");

  return createMenuThemeStyles({
    optionTextColor: resolveStyleColor(optionTextStyles.color),
    surfaceBackgroundColor: resolveStyleColor(surfaceStyles.backgroundColor),
    surfaceBorderColor: resolveStyleColor(surfaceStyles.borderColor),
    shadowColor,
  });
}
