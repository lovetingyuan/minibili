import { clsx } from "clsx";
import React from "react";
import { Pressable, View } from "react-native";

import { Text } from "@/components/styled/rneui";
import { theme } from "@/constants/theme";
import useResolvedColor from "@/hooks/useResolvedColor";

import { CheckBoxIcon } from "./check-box-icon";
import type { CheckBoxProps } from "./check-box.types";

/**
 * Adapted from React Native Elements' CheckBox (MIT).
 * The local version uses the app's theme, Uniwind classes, and Lucide icons.
 */
export function CheckBox({
  checked = false,
  Component = Pressable,
  iconRight = false,
  title,
  titleProps,
  center = false,
  right = false,
  containerStyle,
  wrapperStyle,
  textStyle,
  checkedTitle,
  fontFamily,
  onPress,
  onLongPress,
  onIconPress,
  onLongIconPress,
  disabled = false,
  disabledStyle,
  disabledTitleStyle,
  checkedIcon,
  uncheckedIcon,
  checkedColor,
  uncheckedColor,
  checkedColorClassName,
  uncheckedColorClassName = theme.icon.placeholder,
  containerClassName,
  textClassName,
  wrapperClassName,
  size = 24,
  accessibilityRole,
  accessibilityState,
  ...props
}: CheckBoxProps) {
  const resolvedCheckedColor = useResolvedColor(checkedColorClassName ?? theme.primary.accent);
  const resolvedUncheckedColor = useResolvedColor(uncheckedColorClassName);
  const activeColor = checkedColor ?? resolvedCheckedColor;
  const inactiveColor = uncheckedColor ?? resolvedUncheckedColor;
  const iconProps = {
    checked,
    checkedColor: activeColor,
    checkedIcon,
    onIconPress,
    onLongIconPress,
    size,
    uncheckedColor: inactiveColor,
    uncheckedIcon,
  };
  const titleNode = React.isValidElement(title) ? (
    title
  ) : title !== "" && title !== undefined && title !== null ? (
    <Text
      {...titleProps}
      testID="RNE__CheckBox__Title"
      className={clsx(
        "mx-2.5 font-bold",
        theme.text.secondary,
        disabled && theme.text.disabled,
        textClassName,
      )}
      style={[
        textStyle,
        fontFamily ? { fontFamily } : undefined,
        disabled ? disabledTitleStyle : undefined,
      ]}
    >
      {checked ? checkedTitle || title : title}
    </Text>
  ) : null;

  return (
    <Component
      {...props}
      accessibilityRole={accessibilityRole ?? "checkbox"}
      accessibilityState={{
        ...accessibilityState,
        checked: !!checked,
        disabled: !!disabled,
      }}
      className={clsx("m-[5px] mx-2.5 p-2.5", theme.background.surface, containerClassName)}
      disabled={disabled}
      onLongPress={onLongPress}
      onPress={onPress}
      style={[containerStyle, disabled ? disabledStyle : undefined]}
      testID={props.testID ?? "RNE__CheckBox__Wrapper"}
    >
      <View
        className={clsx(
          "flex-row items-center",
          right && "justify-end",
          center && "justify-center",
          wrapperClassName,
        )}
        style={wrapperStyle}
      >
        {iconRight ? null : <CheckBoxIcon {...iconProps} />}
        {titleNode}
        {iconRight ? <CheckBoxIcon {...iconProps} /> : null}
      </View>
    </Component>
  );
}
