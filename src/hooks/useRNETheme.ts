import { createTheme } from '@rneui/themed'
import React from 'react'

import { colors } from '@/constants/colors.tw'
import useTWC from '@/hooks/useTWC'

import { useAppState } from './useAppState'
import useIsDark from './useIsDark'

export default function useRNETheme() {
  const [primary, secondary] = [
    useTWC(colors.primary.text).color,
    useTWC(colors.secondary.text).color,
  ]
  const isDark = useIsDark()
  const getRNETheme = React.useCallback(() => {
    return createTheme({
      lightColors: {
        primary,
        secondary,
      },
      darkColors: {
        primary,
        secondary,
      },
      mode: isDark ? 'dark' : 'light',
    })
  }, [primary, secondary, isDark])
  const [rneTheme, setRNETheme] = React.useState(getRNETheme)
  React.useEffect(() => {
    setRNETheme(getRNETheme())
  }, [getRNETheme])

  useAppState(() => {
    setRNETheme(getRNETheme())
  })
  return rneTheme
}
