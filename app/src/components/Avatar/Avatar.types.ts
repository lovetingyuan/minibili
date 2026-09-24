import type { ComponentType, ElementType, ReactElement, ReactNode } from "react";
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

export type AvatarImageProps = Omit<ImageProps, "source"> & {
  containerStyle?: StyleProp<ViewStyle>;
  placeholderStyle?: StyleProp<ViewStyle>;
};

export type AvatarProps = Omit<PressableProps, "children" | "style"> & {
  /** 自定义头像外层组件；默认根据是否传入按压事件选择 Pressable 或 View */
  Component?: ElementType;
  /** 自定义图片组件，默认使用 React Native Image */
  ImageComponent?: ComponentType<ImageProps>;
  avatarClassName?: string;
  avatarStyle?: StyleProp<ImageStyle>;
  children?: ReactNode;
  containerClassName?: string;
  containerStyle?: StyleProp<ViewStyle>;
  /** 图片为空或尚未显示时使用的图标内容 */
  icon?: ReactNode;
  imageProps?: AvatarImageProps;
  overlayContainerClassName?: string;
  overlayContainerStyle?: StyleProp<ViewStyle>;
  pressableProps?: Omit<PressableProps, "children" | "style">;
  renderCustomContent?: ReactElement;
  rounded?: boolean;
  size?: AvatarSize;
  source?: ImageSourcePropType;
  title?: string;
  titleClassName?: string;
  titleStyle?: StyleProp<TextStyle>;
};
