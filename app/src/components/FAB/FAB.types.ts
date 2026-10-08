import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import type { ButtonProps } from "@/components/Button";

export type FABProps = Omit<ButtonProps, "size"> & {
  color?: string;
  size?: "large" | "small";
  placement?: "left" | "right";
  visible?: boolean;
  upperCase?: boolean;
  /** 图标使用项目的 ThemedIcon 等 React 节点。 */
  icon?: ReactNode;
  className?: string;
  iconContainerClassName?: string;
  iconContainerStyle?: StyleProp<ViewStyle>;
};
