import { DarkTheme, DefaultTheme } from '@react-navigation/native'
import { useColorScheme } from 'react-native'
import { useResolveClassNames } from 'uniwind'

import { RouteBackgroundColor } from '@/constants/colors.tw'

export default function useRouteTheme() {
  const isDark = useColorScheme() === 'dark'
  const { backgroundColor } = useResolveClassNames(RouteBackgroundColor)
  const resolvedBackgroundColor =
    typeof backgroundColor === "string" ? backgroundColor : DefaultTheme.colors.background

  return isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: resolvedBackgroundColor,
        },
      }
    : DefaultTheme
}
