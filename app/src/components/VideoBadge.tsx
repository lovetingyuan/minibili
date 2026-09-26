import { clsx } from "clsx";

import { Text } from "@/components/styled/rneui";
import { theme } from "@/constants/theme";

import type { VideoBadgeProps, VideoBadgeTone } from "./VideoBadge.types";

export type { VideoBadgeProps, VideoBadgeTone } from "./VideoBadge.types";

/** 每种色调只取一个底色，保证任意封面上白字都能看清 */
const toneBackground: Record<VideoBadgeTone, string> = {
  charge: theme.warning.bg,
  vip: theme.secondary.bg,
  info: theme.primary.bg,
};

/**
 * 视频内容标识：充电专属 / 付费视频 / 大会员 / 交互视频。
 * 页面正文与封面、播放器画面共用同一个组件，只有尺寸略有区别。
 */
export function VideoBadge({ label, tone, variant = "inline", className }: VideoBadgeProps) {
  return (
    <Text
      accessibilityRole="text"
      className={clsx(
        "shrink-0 rounded font-medium text-white",
        variant === "overlay" ? "px-1 py-0.5 text-[10px] leading-4" : "px-1.5 py-0.5 text-xs",
        toneBackground[tone],
        className,
      )}
    >
      {label}
    </Text>
  );
}
