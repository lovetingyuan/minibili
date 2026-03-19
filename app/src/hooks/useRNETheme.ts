import React from 'react'
import { useResolveClassNames } from 'uniwind'

import { createTheme } from '@/components/styled/rneui'
import { colors } from '@/constants/colors.tw'
import useIsDark from './useIsDark'

export default function useRNETheme() {
  const { color: primary } = useResolveClassNames(colors.primary.text)
  const { color: secondary } = useResolveClassNames(colors.secondary.text)
  const { color: white } = useResolveClassNames(colors.white.text)
  const { color: black } = useResolveClassNames(colors.black.text)
  const isDark = useIsDark()
  const lightPrimary = typeof primary === "string" ? primary : undefined
  const lightSecondary = typeof secondary === "string" ? secondary : undefined
  const lightWhite = typeof white === "string" ? white : undefined
  const lightBlack = typeof black === "string" ? black : undefined
  return React.useMemo(() => {
    return createTheme({
      lightColors: {
        primary: lightPrimary,
        secondary: lightSecondary,
        white: lightWhite,
        black: lightBlack,
      },
      darkColors: {
        primary: lightPrimary,
        secondary: lightSecondary,
        white: lightWhite,
        black: lightBlack,
      },
      mode: isDark ? 'dark' : 'light',
    })
  }, [isDark, lightBlack, lightPrimary, lightSecondary, lightWhite])
}
