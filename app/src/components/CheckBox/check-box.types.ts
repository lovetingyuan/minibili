import type { ReactNode } from "react";
import type { PressableProps } from "react-native";

export type CheckBoxProps = Omit<PressableProps, "children" | "onPress"> & {
  checked: boolean;
  title?: ReactNode;
  onPress?: () => void;
  checkedColor?: string;
  uncheckedColor?: string;
  size?: number;
  checkedColorClassName?: string;
  uncheckedColorClassName?: string;
  containerClassName?: string;
  textClassName?: string;
  wrapperClassName?: string;
};
