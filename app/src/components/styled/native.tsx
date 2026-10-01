import React from "react";
import { FlashList as BaseFlashList } from "@shopify/flash-list";
import type { FlashListProps, FlashListRef } from "@shopify/flash-list";
import { Platform, Switch as NativeSwitch, Text as NativeText } from "react-native";
import type {
  SwitchProps as NativeSwitchProps,
  TextProps as NativeTextProps,
  TextStyle,
} from "react-native";

import { theme } from "@/constants/theme";
import useResolvedColor from "@/hooks/useResolvedColor";
import useResolvedStyle from "@/hooks/useResolvedStyle";

export { Button } from "@/components/Button";
export { Skeleton } from "@/components/Skeleton";

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
  const defaultColorStyle = useResolvedStyle(theme.text.primary);
  const resolvedStyle = useResolvedStyle(className);

  return (
    <NativeText
      {...props}
      accessibilityRole={accessibilityRole}
      style={[nativeTextBaseStyle, defaultColorStyle, style, resolvedStyle]}
    />
  );
}

export type { FlashListRef };
