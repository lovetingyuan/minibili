import type { DimensionValue, ViewProps } from "react-native";

export type SkeletonAnimation = "none" | "pulse" | "wave";

export type SkeletonProps = ViewProps & {
  /** 动画类型，默认 pulse */
  animation?: SkeletonAnimation;
  /** 圆形骨架（头像位） */
  circle?: boolean;
  /** 宽度，默认 100% */
  width?: DimensionValue;
  /** 高度，默认 12 */
  height?: number;
  className?: string;
  /** 高光层的额外样式 */
  skeletonClassName?: string;
};
