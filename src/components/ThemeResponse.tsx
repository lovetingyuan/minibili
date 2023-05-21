import React from 'react'
import useIsDark from '../hooks/useIsDark'
import { useThemeMode } from '@rneui/themed'

export default function ThemeResponse() {
  const dark = useIsDark()
  const { setMode } = useThemeMode()

  React.useEffect(() => {
    setMode(dark ? 'dark' : 'light')
  }, [dark])
  return null
}
