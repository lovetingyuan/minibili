import React from "react";
import { BackHandler } from "react-native";
import type { ComponentProps } from "react";
import {
  Menu as PopupMenu,
  MenuOption as PopupMenuOption,
  MenuOptions as PopupMenuOptions,
  MenuProvider,
  MenuTrigger,
} from "react-native-popup-menu";

import { enhanceMenuChildren, handleControlledMenuBackPress } from "./Menu.helpers";
import { menuOptionClassName, menuProviderCustomStyles } from "./Menu.styles";
import { useMenuThemeStyles } from "./useMenuThemeStyles";

type PopupMenuProps = ComponentProps<typeof PopupMenu>;
type PopupMenuOptionProps = ComponentProps<typeof PopupMenuOption>;

export { MenuProvider, PopupMenuOptions as MenuOptions, MenuTrigger };
export { menuOptionClassName, menuProviderCustomStyles };

export function Menu({ children, opened, onClose, ...props }: PopupMenuProps) {
  const menuThemeStyles = useMenuThemeStyles();

  React.useEffect(() => {
    if (!opened) {
      return;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () =>
      handleControlledMenuBackPress({ opened, onClose }),
    );

    return () => {
      subscription.remove();
    };
  }, [opened, onClose]);

  return (
    <PopupMenu {...props} opened={opened} onClose={onClose}>
      {enhanceMenuChildren(children, PopupMenuOptions, menuThemeStyles)}
    </PopupMenu>
  );
}

export function MenuOption({ children, disabled, text, ...props }: PopupMenuOptionProps) {
  if (text === undefined) {
    return (
      <PopupMenuOption {...props} disabled={disabled}>
        {children}
      </PopupMenuOption>
    );
  }

  return <PopupMenuOption {...props} disabled={disabled} text={text} />;
}
