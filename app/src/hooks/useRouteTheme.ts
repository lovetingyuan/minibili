import { DarkTheme, DefaultTheme } from '@react-navigation/native'
import React from 'react'
import { useResolveClassNames } from 'uniwind'

import { RouteBackgroundColor } from '@/constants/colors.tw'
import useIsDark from './useIsDark'

export default function useRouteTheme() {
  const isDark = useIsDark()
  const { backgroundColor } = useResolveClassNames(RouteBackgroundColor)
  const resolvedBackgroundColor =
    typeof backgroundColor === "string" ? backgroundColor : DefaultTheme.colors.background

  return React.useMemo(() => {
    return isDark
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: resolvedBackgroundColor,
          },
        }
      : DefaultTheme
  }, [isDark, resolvedBackgroundColor])
}
