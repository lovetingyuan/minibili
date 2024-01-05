import { useColorScheme } from 'react-native'
import { useThemeMode } from '@rneui/themed'
import React from 'react'

export default React.memo(function ThemeResponse() {
  const { setMode, mode } = useThemeMode()
  const color = useColorScheme()
  if (typeof color === 'string' && color !== mode) {
    setMode(color)
  }
  return null
})
