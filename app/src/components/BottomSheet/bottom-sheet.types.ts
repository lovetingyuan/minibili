import type { ReactNode } from "react";

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** 吸附点高度，像素值或百分比字符串 */
  snapPoints: (number | string)[];
  /** 遮罩最深时的透明度，默认 0.5 */
  backdropOpacity?: number;
  children: ReactNode;
};
