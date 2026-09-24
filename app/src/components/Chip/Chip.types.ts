import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import type { ButtonProps } from "@/components/Button";

export type ChipProps = Omit<
  ButtonProps,
  "children" | "loading" | "loadingStyle" | "radius" | "size" | "title" | "type"
> & {
  children?: ReactNode;
  icon?: ReactNode;
  iconContainerClassName?: string;
  iconContainerStyle?: StyleProp<ViewStyle>;
  iconRight?: boolean;
  title?: ReactNode;
  type?: "solid" | "outline";
};
