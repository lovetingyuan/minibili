// 迁移自 React Native Elements 的 FAB，许可见同目录 LICENSE。
import { clsx } from "clsx";
import { useEffect } from "react";
import { Animated, useAnimatedValue, View } from "react-native";

import { Button } from "@/components/Button";
import { theme } from "@/constants/theme";
import useResolvedColor from "@/hooks/useResolvedColor";

import type { FABProps } from "./FAB.types";

export function FAB({
  buttonClassName,
  buttonStyle,
  children,
  className,
  color,
  containerStyle,
  disabled,
  icon,
  iconContainerClassName,
  iconContainerStyle,
  placement,
  size = "large",
  style,
  title,
  titleClassName,
  upperCase,
  visible = true,
  ...buttonProps
}: FABProps) {
  const animation = useAnimatedValue(Number(visible));
  const secondaryColor = useResolvedColor(theme.secondary.accent);

  useEffect(() => {
    const transition = Animated.timing(animation, {
      toValue: Number(visible),
      duration: 200,
      useNativeDriver: true,
    });
    transition.start();
    return () => transition.stop();
  }, [animation, visible]);

  const iconNode = icon ? (
    <View key="icon" className={iconContainerClassName} style={iconContainerStyle}>
      {icon}
    </View>
  ) : null;

  return (
    <Animated.View
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? "auto" : "no-hide-descendants"}
      pointerEvents={visible ? "auto" : "none"}
      className={clsx(
        "flex-row items-center justify-center rounded-[28px]",
        placement && "absolute bottom-4",
        placement === "right" && "right-4",
        placement === "left" && "left-4",
        className,
      )}
      style={[{ opacity: animation, transform: [{ scale: animation }] }, style]}
    >
      <Button
        {...buttonProps}
        disabled={disabled}
        radius={28}
        buttonClassName={clsx(
          title
            ? size === "small"
              ? "h-10 px-3"
              : "h-12 px-4"
            : size === "small"
              ? "h-10 w-10 px-2 py-2"
              : "h-14 w-14 px-4 py-4",
          buttonClassName,
        )}
        buttonStyle={[
          !disabled && { backgroundColor: color ?? secondaryColor },
          buttonStyle,
        ]}
        containerStyle={[{ elevation: disabled ? 0 : 4 }, containerStyle]}
        titleClassName={clsx("mx-2", upperCase && "uppercase", titleClassName)}
      >
        {children === undefined ? [iconNode, title] : children}
      </Button>
    </Animated.View>
  );
}
