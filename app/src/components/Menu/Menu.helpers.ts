import React from "react";
import type { ComponentProps, ElementType, ReactNode } from "react";
import type { MenuOptions as PopupMenuOptions } from "react-native-popup-menu";

import {
  menuOptionTextStyle,
  menuOptionWrapperStyle,
  menuOptionsContainerStyle,
  menuSurfaceStyle,
} from "./Menu.styles";

type ControlledMenuBackPressInput = {
  opened?: boolean;
  onClose?: () => void;
};

export type MenuOptionsCustomStyles = NonNullable<
  ComponentProps<typeof PopupMenuOptions>["customStyles"]
>;

export { menuOptionTextStyle, menuOptionWrapperStyle, menuSurfaceStyle };

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
): MenuOptionsCustomStyles {
  return {
    optionsWrapper: menuSurfaceStyle,
    optionWrapper: menuOptionWrapperStyle,
    optionText: menuOptionTextStyle,
    ...customStyles,
  };
}

export function enhanceMenuChildren(
  children: ReactNode,
  menuOptionsComponent: ElementType,
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
      customStyles: createMenuOptionsCustomStyles(child.props.customStyles ?? {}),
    });
  });
}
