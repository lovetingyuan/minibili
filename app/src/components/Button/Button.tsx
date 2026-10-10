import { Children } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { GestureResponderEvent } from "react-native";

import { theme } from "@/constants/colors.tw";
import useResolvedColor from "@/hooks/useResolvedColor";
import useResolvedStyle from "@/hooks/useResolvedStyle";

import type { ButtonProps, ButtonRadius, ButtonSize } from "./Button.types";

// 尺寸与圆角沿用 RNE 的 spacing 数值（spacing = { xs: 2, sm: 4, md: 8, lg: 12, xl: 24 }），
// 保证迁移前后的按钮排版完全一致。
const sizePadding: Record<ButtonSize, number> = { sm: 4, md: 8, lg: 12 };
const sizeHorizontalPadding = 2;
const radiusValue: Record<ButtonRadius, number> = { xs: 2, sm: 4, md: 8, lg: 12 };
const pressedOpacity = 0.3;

function resolveRadius(radius: ButtonProps["radius"]) {
  if (typeof radius === "number") {
    return radius;
  }
  return radiusValue[radius ?? "xs"];
}

export function Button({
  accessibilityRole = "button",
  accessibilityState,
  buttonClassName,
  buttonStyle,
  children,
  containerClassName,
  containerStyle,
  disabled = false,
  loading = false,
  loadingStyle,
  onPress,
  radius = "xs",
  size = "md",
  style,
  title = "",
  titleClassName,
  titleStyle,
  type = "solid",
  ...pressableProps
}: ButtonProps) {
  const primaryColor = useResolvedColor(theme.primary.text);
  const solidColor = useResolvedColor(theme.primary.bg);
  const contentColor = useResolvedColor(theme.primary.content);
  const primaryRippleColor = useResolvedColor(theme.ripple.primary);
  const contentRippleColor = useResolvedColor(theme.ripple.content);
  const disabledBackgroundColor = useResolvedColor(theme.background.fillDisabled.accent);
  const disabledBorderColor = useResolvedColor(theme.background.fillMuted.accent);
  const disabledTitleColor = useResolvedColor(theme.text.disabled);
  const resolvedButtonClassName = useResolvedStyle(buttonClassName);
  const resolvedContainerClassName = useResolvedStyle(containerClassName);
  const resolvedTitleClassName = useResolvedStyle(titleClassName);

  const borderRadius = resolveRadius(radius);
  const padding = sizePadding[size];
  const content = children === undefined ? title : children;
  const isSolid = type === "solid";
  const titleColor = disabled ? disabledTitleColor : isSolid ? contentColor : primaryColor;
  const backgroundColor = isSolid
    ? disabled
      ? disabledBackgroundColor
      : solidColor
    : "transparent";
  // 水波纹透明度交给 Uniwind 解析，与标题色使用同一套主题变量。
  const androidRipple =
    Platform.OS === "android" && !disabled
      ? {
          borderless: false,
          color: isSolid ? contentRippleColor : primaryRippleColor,
          foreground: true,
        }
      : null;

  function handlePress(event: GestureResponderEvent) {
    if (!loading && !disabled) {
      onPress?.(event);
    }
  }

  return (
    <View
      style={[styles.container, { borderRadius }, containerStyle, resolvedContainerClassName]}
      testID="RNE_BUTTON_WRAPPER"
    >
      <Pressable
        {...pressableProps}
        accessibilityRole={accessibilityRole}
        accessibilityState={{
          ...accessibilityState,
          busy: loading || !!accessibilityState?.busy,
          disabled,
        }}
        android_ripple={androidRipple}
        delayLongPress={0}
        disabled={disabled}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor,
            borderColor: disabled ? disabledBorderColor : primaryColor,
            borderRadius,
            borderWidth: type === "outline" ? StyleSheet.hairlineWidth : 0,
            padding,
            paddingHorizontal: padding + sizeHorizontalPadding,
          },
          style,
          buttonStyle,
          resolvedButtonClassName,
          pressed && !androidRipple ? styles.pressed : null,
        ]}
        testID="RNE_BUTTON_PRESSABLE"
      >
        {loading ? (
          <ActivityIndicator
            color={titleColor}
            size="small"
            style={[styles.loading, loadingStyle]}
          />
        ) : null}
        {loading
          ? null
          : Children.toArray(content).map((child, index) =>
              typeof child === "string" || typeof child === "number" ? (
                <Text
                  key={index}
                  style={[styles.title, { color: titleColor }, titleStyle, resolvedTitleClassName]}
                >
                  {child}
                </Text>
              ) : (
                child
              ),
            )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  container: {
    overflow: "hidden",
  },
  loading: {
    marginVertical: 2,
  },
  pressed: {
    opacity: pressedOpacity,
  },
  title: {
    fontSize: 16,
    paddingVertical: 1,
    textAlign: "center",
    ...Platform.select({
      android: {
        fontFamily: "sans-serif-medium",
      },
      default: {
        fontSize: 18,
      },
    }),
  },
});
