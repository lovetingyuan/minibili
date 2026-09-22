import { clsx } from "clsx";
import { Image, Pressable, Text, View } from "react-native";

import type { AvatarProps, AvatarSize } from "./Avatar.types";

const avatarSizes = {
  small: 34,
  medium: 50,
  large: 75,
  xlarge: 150,
} as const;

function resolveSize(size: AvatarSize) {
  return typeof size === "number" ? size : avatarSizes[size];
}

export function Avatar({
  accessibilityRole,
  avatarClassName,
  avatarStyle,
  children,
  containerClassName,
  containerStyle,
  imageProps,
  onLongPress,
  onPress,
  onPressIn,
  onPressOut,
  overlayContainerClassName,
  overlayContainerStyle,
  renderCustomContent,
  rounded = false,
  size = "small",
  source,
  title,
  titleClassName,
  titleStyle,
  ...viewProps
}: AvatarProps) {
  const dimension = resolveSize(size);
  const interactive = Boolean(onPress || onLongPress || onPressIn || onPressOut);
  const content = (
    <View
      className={clsx("h-full w-full justify-center", overlayContainerClassName)}
      style={overlayContainerStyle}
    >
      {source ? (
        <Image
          {...imageProps}
          className={clsx("h-full w-full", avatarClassName)}
          source={source}
          style={avatarStyle}
        />
      ) : title ? (
        <Text
          className={clsx("text-center text-white", titleClassName)}
          style={[{ fontSize: dimension / 2 }, titleStyle]}
        >
          {title}
        </Text>
      ) : (
        renderCustomContent
      )}
      {children}
    </View>
  );
  const className = clsx(
    "justify-center",
    rounded && "overflow-hidden rounded-full",
    containerClassName,
  );
  const style = [{ height: dimension, width: dimension }, containerStyle];

  if (interactive) {
    return (
      <Pressable
        {...viewProps}
        accessibilityRole={accessibilityRole ?? "button"}
        className={className}
        onLongPress={onLongPress}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={style}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View {...viewProps} accessibilityRole={accessibilityRole} className={className} style={style}>
      {content}
    </View>
  );
}
