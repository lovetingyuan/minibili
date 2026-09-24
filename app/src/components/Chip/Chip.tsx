import { clsx } from "clsx";
import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { theme } from "../../constants/theme";

import type { ChipProps } from "./Chip.types";

export function Chip({
  buttonClassName,
  buttonStyle,
  children,
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
  ...buttonProps
}: ChipProps) {
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
    <Button
      {...buttonProps}
      buttonClassName={clsx("gap-1 px-3 py-1", disabled && "opacity-50", buttonClassName)}
      buttonStyle={buttonStyle}
      disabled={disabled}
      onPress={onPress}
      radius={30}
      type={type}
    >
      {iconRight ? titleNode : iconNode}
      {iconRight ? iconNode : titleNode}
      {children}
    </Button>
  );
}

Chip.displayName = "Chip";
