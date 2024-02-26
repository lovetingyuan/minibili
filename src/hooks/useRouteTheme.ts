import { DarkTheme, DefaultTheme } from '@react-navigation/native'
import React from 'react'

import { RouteBackgroundColor } from '@/constants/colors.tw'
import useTWC from '@/hooks/useTWC'

import { useAppState } from './useAppState'
import useIsDark from './useIsDark'

export default function useRouteTheme() {
  const isDark = useIsDark()
  const { backgroundColor } = useTWC(RouteBackgroundColor)
  const getRouteTheme = React.useCallback(() => {
    return isDark
      ? {
          dark: true,
          colors: {
            ...DarkTheme.colors,
            background: backgroundColor,
          },
        }
      : {
          ...DefaultTheme,
        }
  }, [isDark, backgroundColor])
  const [routeTheme, setRouteTheme] = React.useState(getRouteTheme)

  useAppState(() => {
    // console.log('change route color mode')
    setRouteTheme(getRouteTheme())
  })
  React.useEffect(() => {
    setRouteTheme(getRouteTheme())
  }, [getRouteTheme])
  return routeTheme
}
