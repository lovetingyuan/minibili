import React from "react";
import type { ComponentProps, ElementType, ReactNode } from "react";
import type { MenuOptions as PopupMenuOptions } from "react-native-popup-menu";

import {
  defaultMenuThemeStyles,
  MenuOptionTouchableComponent,
  menuOptionTextStyle,
  menuOptionTouchableProps,
  menuOptionWrapperStyle,
  menuOptionsContainerStyle,
  menuSurfaceStyle,
  type MenuThemeStyles,
} from "./Menu.styles";

type ControlledMenuBackPressInput = {
  opened?: boolean;
  onClose?: () => void;
};

export type MenuOptionsCustomStyles = NonNullable<
  ComponentProps<typeof PopupMenuOptions>["customStyles"]
>;

export { menuOptionTextStyle, menuOptionWrapperStyle, menuSurfaceStyle };
export { MenuOptionTouchableComponent, menuOptionTouchableProps };
export type { MenuThemeStyles };

export function handleControlledMenuBackPress({
  opened,
  onClose,
}: ControlledMenuBackPressInput): boolean {
  if (!opened) {
    return false;
  }

  onClose?.();
  return true;
}

export function createMenuOptionsCustomStyles(
  customStyles: MenuOptionsCustomStyles,
  themeStyles: MenuThemeStyles = defaultMenuThemeStyles,
): MenuOptionsCustomStyles {
  return {
    OptionTouchableComponent: MenuOptionTouchableComponent,
    optionTouchable: menuOptionTouchableProps,
    optionsWrapper: themeStyles.optionsWrapper,
    optionWrapper: menuOptionWrapperStyle,
    optionText: themeStyles.optionText,
    ...customStyles,
  };
}

export function enhanceMenuChildren(
  children: ReactNode,
  menuOptionsComponent: ElementType,
  themeStyles: MenuThemeStyles = defaultMenuThemeStyles,
): ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement<ComponentProps<typeof PopupMenuOptions>>(child)) {
      return child;
    }

    if (child.type !== menuOptionsComponent) {
      return child;
    }

    return React.cloneElement(child, {
      optionsContainerStyle: [menuOptionsContainerStyle, child.props.optionsContainerStyle],
      customStyles: createMenuOptionsCustomStyles(child.props.customStyles ?? {}, themeStyles),
    });
  });
}
