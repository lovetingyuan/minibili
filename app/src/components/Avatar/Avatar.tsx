import { clsx } from "clsx";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { AvatarProps, AvatarSize } from "./Avatar.types";

export const avatarSizes = {
  small: 34,
  medium: 50,
  large: 75,
  xlarge: 150,
} as const;

function resolveSize(size: AvatarSize) {
  return typeof size === "number" ? size : avatarSizes[size];
}

export function Avatar({
  Component,
  ImageComponent = Image,
  accessibilityRole,
  avatarClassName,
  avatarStyle,
  children,
  containerClassName,
  containerStyle,
  icon,
  imageProps,
  onLongPress,
  onPress,
  onPressIn,
  onPressOut,
  overlayContainerClassName,
  overlayContainerStyle,
  pressableProps,
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
  const {
    containerStyle: imageContainerStyle,
    placeholderStyle,
    style: imageStyle,
    ...nativeImageProps
  } = imageProps ?? {};
  const resolvedOnPress = pressableProps?.onPress ?? onPress;
  const resolvedOnLongPress = pressableProps?.onLongPress ?? onLongPress;
  const resolvedOnPressIn = pressableProps?.onPressIn ?? onPressIn;
  const resolvedOnPressOut = pressableProps?.onPressOut ?? onPressOut;
  const interactive = Boolean(
    resolvedOnPress || resolvedOnLongPress || resolvedOnPressIn || resolvedOnPressOut,
  );
  const RootComponent = Component ?? (interactive ? Pressable : View);
  const placeholderContent = title ? (
    <Text
      className={clsx("text-center text-white", titleClassName)}
      style={[styles.title, { fontSize: dimension / 2 }, titleStyle]}
    >
      {title}
    </Text>
  ) : (
    (icon ?? renderCustomContent)
  );
  const content = source ? (
    <View
      className={clsx(
        "h-full w-full justify-center",
        rounded && "overflow-hidden rounded-full",
        overlayContainerClassName,
      )}
      style={[
        styles.overlayContainer,
        rounded && { borderRadius: dimension / 2 },
        overlayContainerStyle,
        imageContainerStyle,
      ]}
      testID="RNE__Avatar__Image"
    >
      {placeholderContent ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.placeholder, placeholderStyle]}
        >
          {placeholderContent}
        </View>
      ) : null}
      <ImageComponent
        {...nativeImageProps}
        className={clsx("h-full w-full", avatarClassName)}
        source={source}
        style={[styles.avatar, imageStyle, avatarStyle]}
      />
    </View>
  ) : (
    placeholderContent
  );
  const className = clsx("justify-center", rounded && "rounded-full", containerClassName);
  const style = [
    styles.container,
    { height: dimension, width: dimension },
    rounded && { borderRadius: dimension / 2 },
    containerStyle,
  ];

  return (
    <RootComponent
      {...viewProps}
      {...pressableProps}
      accessibilityRole={accessibilityRole ?? (interactive ? "button" : undefined)}
      className={className}
      onLongPress={resolvedOnLongPress}
      onPress={resolvedOnPress}
      onPressIn={resolvedOnPressIn}
      onPressOut={resolvedOnPressOut}
      style={style}
    >
      {content}
      {children}
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  avatar: {
    height: "100%",
    width: "100%",
  },
  container: {
    justifyContent: "center",
  },
  overlayContainer: {
    flex: 1,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    backgroundColor: "transparent",
    color: "#ffffff",
    textAlign: "center",
    zIndex: 1,
  },
});

Avatar.displayName = "Avatar";
