import { createTheme } from '@rneui/themed'
import { useTw } from '@tingyuan/react-native-tailwindcss'
import React from 'react'

import { colors } from '@/constants/colors.tw'

import { useAppState } from './useAppState'
import useIsDark from './useIsDark'

export default function useRNETheme() {
  const tw = useTw()
  const [primary, secondary] = [
    tw(colors.primary.text).color,
    tw(colors.secondary.text).color,
  ]
  // console.log(primary, secondary)
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
