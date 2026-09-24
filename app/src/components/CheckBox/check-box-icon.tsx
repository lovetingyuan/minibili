import React from "react";
import { Square, SquareCheck } from "lucide-react-native";

import type { CheckBoxIconProps } from "./check-box.types";

export function CheckBoxIcon({
  checked,
  onIconPress,
  onLongIconPress,
  size = 24,
  checkedIcon,
  uncheckedIcon,
  checkedColor,
  uncheckedColor,
}: CheckBoxIconProps) {
  if (checked && React.isValidElement(checkedIcon)) {
    return checkedIcon;
  }
  if (!checked && React.isValidElement(uncheckedIcon)) {
    return uncheckedIcon;
  }

  const Icon = checked ? SquareCheck : Square;

  return (
    <Icon
      testID="RNE__Checkbox__Icon"
      color={checked ? checkedColor : uncheckedColor}
      onLongPress={onLongIconPress}
      onPress={onIconPress}
      size={size || 24}
      style={{ minWidth: size || 24 }}
    />
  );
}
