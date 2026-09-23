import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import { defaultTheme, themes } from "@/constants/theme";
import type { Theme, ThemeId } from "@/constants/theme";

/**
 * 当前主题：现在只有一份默认主题，以后要做主题切换时改这里（或接到 store 上），
 * 用 useTheme 取色的组件会自动跟着换。
 */
const currentThemeId: ThemeId = "default";

const ThemeContext = createContext<Theme>(defaultTheme);

export function ThemeProvider(props: { children: ReactNode }) {
  const value = themes[currentThemeId];
  return <ThemeContext.Provider value={value}>{props.children}</ThemeContext.Provider>;
}

/** 取当前主题，组件里用它代替直接 import theme */
export default function useTheme() {
  return useContext(ThemeContext);
}
