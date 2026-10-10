import React from 'react'
import { TouchableHighlight } from 'react-native'
import type { ComponentProps } from 'react'
import type { TextStyle, ViewStyle } from 'react-native'

import { theme } from '@/constants/colors.tw'
import useResolvedColor from '@/hooks/useResolvedColor'
import type { MenuProviderCustomStyles, MenuThemeStyles } from './Menu.types'
export type { MenuThemeStyles } from './Menu.types'

const SCREEN_INDENT = 8

export const menuProviderCustomStyles: MenuProviderCustomStyles = {
  safeArea: {
    top: SCREEN_INDENT,
    right: SCREEN_INDENT,
    bottom: SCREEN_INDENT,
    left: SCREEN_INDENT,
  },
}

export const menuOptionsContainerStyle: ViewStyle = {
  backgroundColor: 'transparent',
  elevation: 0,
  paddingTop: 20,
  shadowOpacity: 0,
  shadowRadius: 0,
  width: undefined,
}

export const menuOptionWrapperStyle: ViewStyle = {
  alignItems: 'stretch',
  backgroundColor: 'transparent',
  height: 48,
  justifyContent: 'center',
  maxWidth: 248,
  minWidth: 124,
  padding: 0,
}

export const menuOptionTouchableProps: Pick<
  ComponentProps<typeof TouchableHighlight>,
  'activeOpacity' | 'underlayColor'
> = {
  activeOpacity: 1,
}

export function MenuOptionTouchableComponent(props: ComponentProps<typeof TouchableHighlight>) {
  const underlayColor = useResolvedColor('accent-pressed')
  return React.createElement(TouchableHighlight, {
    ...props,
    underlayColor: props.underlayColor ?? underlayColor,
  })
}

export const menuSurfaceClassName = `${theme.background.overlay} ${theme.border.divider}`

export const menuOptionTextClassName = theme.text.primary

export const menuSurfaceStyle: ViewStyle = {
  borderRadius: 4,
  borderWidth: 1,
  elevation: 4,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
}

export const menuOptionTextStyle: TextStyle = {
  fontSize: 14,
  fontWeight: '400',
  paddingHorizontal: 16,
  textAlign: 'left',
}

export function resolveStyleColor(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export function createMenuSurfaceStyle(
  backgroundColor?: string,
  borderColor?: string,
  shadowColor?: string,
): ViewStyle {
  return {
    ...menuSurfaceStyle,
    ...(backgroundColor ? { backgroundColor } : {}),
    ...(borderColor ? { borderColor } : {}),
    ...(shadowColor ? { shadowColor } : {}),
  }
}

export function createMenuOptionTextStyle(color?: string): TextStyle {
  return {
    ...menuOptionTextStyle,
    ...(color ? { color } : {}),
  }
}

export function createMenuThemeStyles(theme: {
  optionTextColor?: string
  surfaceBackgroundColor?: string
  surfaceBorderColor?: string
  shadowColor?: string
}): MenuThemeStyles {
  return {
    optionText: createMenuOptionTextStyle(theme.optionTextColor),
    optionsWrapper: createMenuSurfaceStyle(
      theme.surfaceBackgroundColor,
      theme.surfaceBorderColor,
      theme.shadowColor,
    ),
  }
}

export const defaultMenuThemeStyles: MenuThemeStyles = createMenuThemeStyles({})

export const menuOptionClassName = 'h-12 min-w-[124px] max-w-[248px] justify-center'
