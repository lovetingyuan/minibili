import React from "react";
import { Button as BaseButton, Skeleton as BaseSkeleton, ThemeProvider, createTheme } from "@rneui/themed";
import type {
  ButtonProps as BaseButtonProps,
  SkeletonProps as BaseSkeletonProps,
} from "@rneui/base";
import { FlashList as BaseFlashList } from "@shopify/flash-list";
import type { FlashListProps, FlashListRef } from "@shopify/flash-list";
import { Platform, Switch as NativeSwitch, Text as NativeText } from "react-native";
import type {
  SwitchProps as NativeSwitchProps,
  TextProps as NativeTextProps,
  TextStyle,
} from "react-native";
import { useResolveClassNames } from "uniwind";

import { colors } from "@/constants/colors.tw";

function useResolvedStyle(className?: string) {
  return useResolveClassNames(className ?? "");
}

function useResolvedColor(className?: string) {
  const styles = useResolveClassNames(className ?? "");

  if (typeof styles.accentColor === "string") {
    return styles.accentColor;
  }
  if (typeof styles.color === "string") {
    return styles.color;
  }

  return undefined;
}

type ButtonProps = BaseButtonProps & {
  buttonClassName?: string;
  containerClassName?: string;
  iconContainerClassName?: string;
  titleClassName?: string;
  children?: React.ReactNode;
};

export function Button({
  buttonClassName,
  containerClassName,
  iconContainerClassName,
  titleClassName,
  buttonStyle,
  containerStyle,
  iconContainerStyle,
  titleStyle,
  ...props
}: ButtonProps) {
  const resolvedButtonStyle = useResolvedStyle(buttonClassName);
  const resolvedContainerStyle = useResolvedStyle(containerClassName);
  const resolvedIconContainerStyle = useResolvedStyle(iconContainerClassName);
  const resolvedTitleStyle = useResolvedStyle(titleClassName);

  return (
    <ButtonPrimitive
      {...props}
      buttonStyle={[buttonStyle, resolvedButtonStyle]}
      containerStyle={[containerStyle, resolvedContainerStyle]}
      iconContainerStyle={[iconContainerStyle, resolvedIconContainerStyle]}
      titleStyle={[titleStyle, resolvedTitleStyle]}
    />
  );
}

type StyledFlashListProps<T> = FlashListProps<T> & {
  className?: string;
  contentContainerClassName?: string;
  ListFooterComponentClassName?: string;
  ListHeaderComponentClassName?: string;
};

type FlashListComponent = <T>(
  props: StyledFlashListProps<T> & { ref?: React.Ref<FlashListRef<T>> },
) => React.ReactElement;

const FlashListBase = React.forwardRef(function FlashListInner<T>(
  {
    className,
    contentContainerClassName,
    ListFooterComponentClassName,
    ListHeaderComponentClassName,
    style,
    contentContainerStyle,
    ListFooterComponentStyle,
    ListHeaderComponentStyle,
    ...props
  }: StyledFlashListProps<T>,
  ref: React.ForwardedRef<FlashListRef<T>>,
) {
  const resolvedStyle = useResolvedStyle(className);
  const resolvedContentContainerStyle = useResolvedStyle(contentContainerClassName);
  const resolvedFooterStyle = useResolvedStyle(ListFooterComponentClassName);
  const resolvedHeaderStyle = useResolvedStyle(ListHeaderComponentClassName);

  return (
    <BaseFlashList
      {...props}
      ref={ref}
      style={{ ...style, ...resolvedStyle }}
      contentContainerStyle={[contentContainerStyle, resolvedContentContainerStyle]}
      ListFooterComponentStyle={[ListFooterComponentStyle, resolvedFooterStyle]}
      ListHeaderComponentStyle={[ListHeaderComponentStyle, resolvedHeaderStyle]}
    />
  );
}) as FlashListComponent;

export const FlashList = FlashListBase;

type SkeletonProps = BaseSkeletonProps & {
  className?: string;
  skeletonClassName?: string;
};

type SwitchProps = NativeSwitchProps & {
  colorClassName?: string;
  iosBackgroundColorClassName?: string;
  trackColorOnClassName?: string;
  trackColorOffClassName?: string;
};

export function Switch({
  colorClassName,
  iosBackgroundColorClassName,
  trackColorOnClassName,
  trackColorOffClassName,
  thumbColor,
  ios_backgroundColor,
  trackColor,
  ...props
}: SwitchProps) {
  const resolvedColor = useResolvedColor(colorClassName);
  const resolvedIosBackgroundColor = useResolvedColor(iosBackgroundColorClassName);
  const resolvedTrackColorOn = useResolvedColor(trackColorOnClassName);
  const resolvedTrackColorOff = useResolvedColor(trackColorOffClassName);

  return (
    <NativeSwitch
      {...props}
      thumbColor={resolvedColor ?? thumbColor}
      ios_backgroundColor={resolvedIosBackgroundColor ?? ios_backgroundColor}
      trackColor={{
        false: resolvedTrackColorOff ?? trackColor?.false,
        true: resolvedTrackColorOn ?? trackColor?.true,
      }}
    />
  );
}

export function Skeleton({
  className,
  skeletonClassName,
  style,
  skeletonStyle,
  ...props
}: SkeletonProps) {
  const resolvedClassStyle = useResolvedStyle(className);
  const resolvedSkeletonStyle = useResolvedStyle(skeletonClassName);

  return (
    <BaseSkeleton
      {...props}
      style={[style, resolvedClassStyle]}
      skeletonStyle={[skeletonStyle, resolvedSkeletonStyle]}
    />
  );
}

type TextProps = NativeTextProps & {
  className?: string;
};

const nativeTextBaseStyle = Platform.select<TextStyle>({
  android: {
    fontFamily: "sans-serif",
    fontWeight: "normal",
  },
});

export function Text({ className, style, accessibilityRole = "text", ...props }: TextProps) {
  const defaultColorStyle = useResolvedStyle(colors.black.text);
  const resolvedStyle = useResolvedStyle(className);

  return (
    <NativeText
      {...props}
      accessibilityRole={accessibilityRole}
      style={[nativeTextBaseStyle, defaultColorStyle, style, resolvedStyle]}
    />
  );
}

const ButtonPrimitive = BaseButton as unknown as React.ComponentType<ButtonProps>;
export { ThemeProvider, createTheme };
export type { FlashListProps, FlashListRef };
