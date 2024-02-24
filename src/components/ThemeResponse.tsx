import { useThemeMode } from '@rneui/themed'
import React from 'react'
import { useColorScheme } from 'react-native'

import { useAppState } from '@/hooks/useAppState'

export default React.memo(function ThemeResponse() {
  const { setMode, mode } = useThemeMode()
  const color = useColorScheme()

  const changeColorMode = React.useCallback(() => {
    if (color && color !== mode) {
      // setTimeout(() => {
      // console.log('set color mode ', color)
      setMode(color)
      // }, 100)
    }
  }, [color, mode, setMode])
  React.useEffect(() => {
    // console.log('change color mode')
    changeColorMode()
  }, [changeColorMode])

  useAppState(changeColorMode)

  return null
})
