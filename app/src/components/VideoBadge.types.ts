/** 角标色调：充电橙、会员粉、交互蓝 */
export type VideoBadgeTone = "charge" | "vip" | "info";

/**
 * `inline` 用于页面正文（标题旁、信息区），`overlay` 用于封面与播放器画面，尺寸更紧凑。
 */
export type VideoBadgeVariant = "inline" | "overlay";

export type VideoBadgeProps = {
  label: string;
  tone: VideoBadgeTone;
  variant?: VideoBadgeVariant;
  className?: string;
};
