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

export function Menu({ className, style, ...props }: StyledMenuProps) {
  const resolvedStyle = useResolveClassNames(className ?? "");

  return <BaseMenu {...props} style={Object.assign({}, style, resolvedStyle)} />;
}

type StyledMenuDividerProps = MenuDividerProps & {
  colorClassName?: string;
};

export function MenuDivider({ color, colorClassName }: StyledMenuDividerProps) {
  const resolvedStyle = useResolveClassNames(colorClassName ?? "");
  const resolvedColor =
    typeof resolvedStyle.accentColor === "string"
      ? resolvedStyle.accentColor
      : typeof resolvedStyle.color === "string"
        ? resolvedStyle.color
        : undefined;

  return <BaseMenuDivider color={resolvedColor ?? color} />;
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
  style,
  textClassName,
  textStyle,
  ...props
}: StyledMenuItemProps) {
  const resolvedStyle = useResolveClassNames(className ?? "");
  const resolvedTextStyle = useResolveClassNames(textClassName ?? "");
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
      pressColor={resolvedPressColor ?? pressColor}
      style={Object.assign({}, style, resolvedStyle)}
      textStyle={Object.assign({}, textStyle, resolvedTextStyle)}
    />
  );
}

export type { MenuDividerProps, MenuItemProps, MenuProps };
