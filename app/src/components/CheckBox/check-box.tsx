import { Check } from "lucide-react-native";
import { Pressable, View } from "react-native";

import type { CheckBoxProps } from "./check-box.types";

import { Text } from "@/components/styled/rneui";
import { theme } from "@/constants/theme";
import useResolvedColor from "@/hooks/useResolvedColor";

// 勾选框的尺寸和颜色都来自运行时 props，静态 tailwind class 表达不了，只能写 style。
export function CheckBox({
  checked,
  title,
  onPress,
  disabled,
  checkedColorClassName,
  uncheckedColorClassName = theme.icon.placeholder,
  containerClassName,
  textClassName,
  wrapperClassName,
  checkedColor,
  uncheckedColor,
  size = 20,
  ...props
}: CheckBoxProps) {
  const resolvedCheckedColor = useResolvedColor(checkedColorClassName ?? "");
  const resolvedUncheckedColor = useResolvedColor(uncheckedColorClassName);
  const activeColor = resolvedCheckedColor ?? checkedColor;
  const inactiveColor = uncheckedColor ?? resolvedUncheckedColor;

  return (
    <Pressable
      {...props}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !!disabled }}
      className={containerClassName}
      disabled={disabled}
      onPress={onPress}
    >
      <View className={`flex-row items-center gap-2 ${wrapperClassName ?? ""}`}>
        <View
          className="items-center justify-center rounded-[4px] border"
          style={{
            backgroundColor: checked ? activeColor : "transparent",
            borderColor: checked ? activeColor : inactiveColor,
            height: size,
            width: size,
          }}
        >
          {checked ? <Check color="#ffffff" size={size * 0.7} strokeWidth={3} /> : null}
        </View>
        {typeof title === "string" || typeof title === "number" ? (
          <Text className={textClassName}>{title}</Text>
        ) : (
          title
        )}
      </View>
    </Pressable>
  );
}
