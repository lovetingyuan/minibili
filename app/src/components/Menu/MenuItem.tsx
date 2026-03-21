import React from "react";
import { clsx } from "clsx";

import {
  Platform,
  Pressable,
  PressableProps,
  Text,
  View,
} from "react-native";

export type MenuItemProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  pressColor?: string;
  textClassName?: string;
} & PressableProps;

export function MenuItem({
  children,
  className,
  disabled = false,
  onPress,
  pressColor = "#e0e0e0",
  textClassName,
  ...props
}: MenuItemProps) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: Platform.OS !== "android" && pressed ? pressColor : undefined,
      })}
      android_ripple={{ color: pressColor }}
      onPress={onPress}
      {...props}
    >
      <View className={clsx("h-12 min-w-[124px] max-w-[248px] justify-center", className)}>
        <Text
          numberOfLines={1}
          className={clsx(
            "px-4 text-left text-sm font-normal",
            disabled && "text-[#bdbdbd]",
            textClassName,
          )}
        >
          {children}
        </Text>
      </View>
    </Pressable>
  );
}
