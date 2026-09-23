import { clsx } from "clsx";
import { Pressable } from "react-native";
import type { PressableProps } from "react-native";

/**
 * 图标按钮：36x36 的圆形热区、内容居中，默认透明、按住时才出现背景，
 * 路由头部等位置的图标入口统一用它，避免裸图标没有可点击的观感。
 */
const iconButtonClassName =
  "h-9 w-9 items-center justify-center rounded-full active:bg-slate-400/30";

export function IconButton({ className, ...props }: PressableProps) {
  return <Pressable {...props} className={clsx(iconButtonClassName, className)} />;
}
