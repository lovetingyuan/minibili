import React from 'react'
import useIsDark from '../hooks/useIsDark'
import { useThemeMode } from '@rneui/themed'
import useMemoizedFn from '../hooks/useMemoizedFn'

export default function ThemeResponse() {
  const { setMode } = useThemeMode()
  const isDark = useIsDark()
  const setMode2 = useMemoizedFn((t: 'light' | 'dark') => {
    setMode(t)
  })

  React.useEffect(() => {
    setMode2(isDark ? 'dark' : 'light')
  }, [isDark, setMode2])
  return null
}
