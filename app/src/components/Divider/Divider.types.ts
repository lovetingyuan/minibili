import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";

export type DividerProps = ViewProps & {
  className?: string;
  color?: string;
  inset?: boolean;
  insetType?: "left" | "right" | "middle";
  orientation?: "horizontal" | "vertical";
  style?: StyleProp<ViewStyle>;
  subHeader?: string;
  subHeaderClassName?: string;
  subHeaderStyle?: StyleProp<TextStyle>;
  width?: number;
};
