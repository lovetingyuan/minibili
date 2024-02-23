import { useThemeMode } from '@rneui/themed'
import React from 'react'
import { useColorScheme } from 'react-native'

export default React.memo(function ThemeResponse() {
  const { setMode, mode } = useThemeMode()
  const color = useColorScheme()
  React.useEffect(() => {
    if (color && color !== mode) {
      setTimeout(() => {
        setMode(color)
      }, 200)
    }
  }, [color, mode, setMode])

  return null
})
