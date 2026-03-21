import React from "react";
import { useResolveClassNames } from "uniwind";

import { Menu as BaseMenu } from "./Menu";
import { MenuDivider as BaseMenuDivider } from "./MenuDivider";
import { MenuItem as BaseMenuItem } from "./MenuItem";
import type { MenuDividerProps } from "./MenuDivider";
import type { MenuItemProps } from "./MenuItem";
import type { MenuProps } from "./Menu";

type StyledMenuProps = MenuProps & {
  className?: string;
};

export function Menu({ className, ...props }: StyledMenuProps) {
  return <BaseMenu {...props} className={className} />;
}

type StyledMenuDividerProps = MenuDividerProps & {
  className?: string;
  colorClassName?: string;
};

export function MenuDivider({ className, colorClassName }: StyledMenuDividerProps) {
  return <BaseMenuDivider className={[className, colorClassName].filter(Boolean).join(" ")} />;
}

type StyledMenuItemProps = MenuItemProps & {
  className?: string;
  pressColorClassName?: string;
  textClassName?: string;
};

export function MenuItem({
  className,
  pressColor,
  pressColorClassName,
  textClassName,
  ...props
}: StyledMenuItemProps) {
  const resolvedPressColorStyle = useResolveClassNames(pressColorClassName ?? "");
  const resolvedPressColor =
    typeof resolvedPressColorStyle.accentColor === "string"
      ? resolvedPressColorStyle.accentColor
      : typeof resolvedPressColorStyle.color === "string"
        ? resolvedPressColorStyle.color
        : undefined;

  return (
    <BaseMenuItem
      {...props}
      className={className}
      pressColor={resolvedPressColor ?? pressColor}
      textClassName={textClassName}
    />
  );
}

export type { MenuDividerProps, MenuItemProps, MenuProps };
