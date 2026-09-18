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

import { IconButton } from "@/components/IconButton";

import { enhanceMenuChildren, handleControlledMenuBackPress } from "./Menu.helpers";
import { menuOptionClassName, menuProviderCustomStyles } from "./Menu.styles";
import { useMenuThemeStyles } from "./useMenuThemeStyles";

type PopupMenuProps = ComponentProps<typeof PopupMenu>;
type PopupMenuOptionProps = ComponentProps<typeof PopupMenuOption>;
type MenuTriggerCustomStyles = NonNullable<ComponentProps<typeof MenuTrigger>["customStyles"]>;

export { MenuProvider, PopupMenuOptions as MenuOptions, MenuTrigger };
export { menuOptionClassName, menuProviderCustomStyles };

/** 把菜单触发器渲染成圆形图标按钮，而不是没有点击热区的裸图标 */
export const menuTriggerIconButtonStyles: MenuTriggerCustomStyles = {
  TriggerTouchableComponent: IconButton,
};

export function Menu({ children, opened, onClose, ...props }: PopupMenuProps) {
  const menuThemeStyles = useMenuThemeStyles();
  // 返回键回调不参与依赖，避免 onClose 每次变化都重新订阅
  const handleBackPress = React.useEffectEvent(() =>
    handleControlledMenuBackPress({ opened, onClose }),
  );

  React.useEffect(() => {
    if (!opened) {
      return;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", handleBackPress);

    return () => {
      subscription.remove();
    };
  }, [opened]);

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
