import { createTheme } from '@rn-vui/themed'
import React from 'react'

import { colors } from '@/constants/colors.tw'
import { useTWC } from '@/hooks/useTWC'

import { useAppStateChange } from './useAppState'
import useIsDark from './useIsDark'

export default function useRNETheme() {
  const [primary, secondary, white, black] = [
    useTWC(colors.primary.text).color,
    useTWC(colors.secondary.text).color,
    useTWC(colors.white.text).color,
    useTWC(colors.black.text).color,
  ]
  const isDark = useIsDark()
  const getRNETheme = React.useCallback(() => {
    return createTheme({
      lightColors: {
        primary,
        secondary,
        white,
        black,
      },
      darkColors: {
        primary,
        secondary,
        white,
        black,
      },
      mode: isDark ? 'dark' : 'light',
    })
  }, [primary, secondary, isDark, white, black])
  const [rneTheme, setRNETheme] = React.useState(getRNETheme)
  React.useEffect(() => {
    setRNETheme(getRNETheme())
  }, [getRNETheme])

  useAppStateChange(() => {
    setRNETheme(getRNETheme())
  })
  return rneTheme
}
