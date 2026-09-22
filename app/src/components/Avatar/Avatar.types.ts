import type { ReactNode } from "react";
import type {
  ImageProps,
  ImageSourcePropType,
  ImageStyle,
  PressableProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";

export type AvatarSize = "small" | "medium" | "large" | "xlarge" | number;

export type AvatarProps = Omit<PressableProps, "children" | "style"> & {
  avatarClassName?: string;
  avatarStyle?: StyleProp<ImageStyle>;
  children?: ReactNode;
  containerClassName?: string;
  containerStyle?: StyleProp<ViewStyle>;
  imageProps?: Omit<ImageProps, "source" | "style">;
  overlayContainerClassName?: string;
  overlayContainerStyle?: StyleProp<ViewStyle>;
  renderCustomContent?: ReactNode;
  rounded?: boolean;
  size?: AvatarSize;
  source?: ImageSourcePropType;
  title?: string;
  titleClassName?: string;
  titleStyle?: StyleProp<TextStyle>;
};
