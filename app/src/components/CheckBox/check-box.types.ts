import type { ElementType, ReactElement, ReactNode } from "react";
import type { PressableProps, StyleProp, TextProps, TextStyle, ViewStyle } from "react-native";

export type CheckBoxIconProps = {
  checked: boolean;
  onIconPress?: () => void;
  onLongIconPress?: () => void;
  size?: number;
  checkedIcon?: ReactElement;
  uncheckedIcon?: ReactElement;
  checkedColor?: string;
  uncheckedColor?: string;
};

export type CheckBoxProps = Omit<PressableProps, "children" | "disabled" | "style"> &
  CheckBoxIconProps & {
    /** 用于替换默认 Pressable 的容器组件。 */
    Component?: ElementType<PressableProps>;
    /** 将图标放到标题右侧。 */
    iconRight?: boolean;
    title?: ReactNode;
    titleProps?: TextProps;
    center?: boolean;
    right?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
    wrapperStyle?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    disabled?: boolean;
    disabledStyle?: StyleProp<ViewStyle>;
    disabledTitleStyle?: StyleProp<TextStyle>;
    checkedTitle?: string;
    fontFamily?: string;
    checkedColorClassName?: string;
    uncheckedColorClassName?: string;
    containerClassName?: string;
    textClassName?: string;
    wrapperClassName?: string;
  };
