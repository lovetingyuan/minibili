import { clsx } from "clsx";
import { Pressable, Text, View } from "react-native";

import { theme } from "../../constants/theme";

import type { ChipProps } from "./Chip.types";

export function Chip({
  accessibilityRole,
  accessibilityState,
  buttonClassName,
  buttonStyle,
  children,
  containerClassName,
  containerStyle,
  disabled = false,
  icon,
  iconContainerClassName,
  iconContainerStyle,
  iconRight = false,
  onPress,
  title,
  titleClassName,
  titleStyle,
  type = "solid",
  ...pressableProps
}: ChipProps) {
  const isDisabled = disabled === true;
  const titleNode =
    typeof title === "string" || typeof title === "number" ? (
      <Text
        className={clsx(
          "px-0.5 text-sm",
          type === "outline" ? theme.primary.text : "text-white",
          titleClassName,
        )}
        style={titleStyle}
      >
        {title}
      </Text>
    ) : (
      title
    );
  const iconNode = icon ? (
    <View className={iconContainerClassName} style={iconContainerStyle}>
      {icon}
    </View>
  ) : null;

  return (
    <View className={containerClassName} style={containerStyle}>
      <Pressable
        {...pressableProps}
        accessibilityRole={accessibilityRole ?? (onPress ? "button" : undefined)}
        accessibilityState={{ ...accessibilityState, disabled: isDisabled }}
        className={clsx(
          "flex-row items-center justify-center gap-1 rounded-full px-3 py-1",
          type === "outline" ? `border bg-transparent ${theme.primary.border}` : theme.primary.bg,
          onPress && "active:opacity-70",
          isDisabled && "opacity-50",
          buttonClassName,
        )}
        disabled={isDisabled}
        onPress={onPress}
        style={buttonStyle}
      >
        {iconRight ? titleNode : iconNode}
        {iconRight ? iconNode : titleNode}
        {children}
      </Pressable>
    </View>
  );
}
