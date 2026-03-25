import React from "react";
import { clsx } from "clsx";

import { Platform, Pressable, Text, View } from "react-native";
import type { PressableProps } from "react-native";

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
      android_ripple={{ color: pressColor }}
      onPress={onPress}
      {...props}
    >
      {({ pressed }) => (
        <View
          className={clsx("h-12 min-w-[124px] max-w-[248px] justify-center", className)}
          style={{
            backgroundColor: Platform.OS !== "android" && pressed ? pressColor : undefined,
          }}
        >
          <Text
            numberOfLines={1}
            className={clsx(
              "px-4 text-left text-sm font-normal",
              disabled && "text-gray-400 dark:text-gray-500",
              textClassName,
            )}
          >
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
