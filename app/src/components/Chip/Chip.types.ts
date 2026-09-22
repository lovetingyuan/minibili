import type { ReactNode } from "react";
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from "react-native";

export type ChipProps = Omit<PressableProps, "children" | "style"> & {
  buttonClassName?: string;
  buttonStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
  containerClassName?: string;
  containerStyle?: StyleProp<ViewStyle>;
  icon?: ReactNode;
  iconContainerClassName?: string;
  iconContainerStyle?: StyleProp<ViewStyle>;
  iconRight?: boolean;
  title?: ReactNode;
  titleClassName?: string;
  titleStyle?: StyleProp<TextStyle>;
  type?: "solid" | "outline";
};
