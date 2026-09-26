import type { ReactNode } from "react";
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from "react-native";

type ButtonType = "solid" | "clear" | "outline";

export type ButtonSize = "sm" | "md" | "lg";

export type ButtonRadius = "xs" | "sm" | "md" | "lg";

export type ButtonProps = Omit<PressableProps, "children" | "disabled" | "style"> & {
  /** 按钮标题，等价于直接写 children */
  title?: string;
  children?: ReactNode;
  /** 按钮类型，默认 solid */
  type?: ButtonType;
  /** 按钮尺寸，默认 md */
  size?: ButtonSize;
  /** 圆角，默认 xs；传数字则按像素使用 */
  radius?: number | ButtonRadius;
  loading?: boolean;
  disabled?: boolean;
  /** 按压区域的样式 */
  style?: StyleProp<ViewStyle>;
  buttonClassName?: string;
  buttonStyle?: StyleProp<ViewStyle>;
  containerClassName?: string;
  containerStyle?: StyleProp<ViewStyle>;
  titleClassName?: string;
  titleStyle?: StyleProp<TextStyle>;
  loadingStyle?: StyleProp<ViewStyle>;
};
