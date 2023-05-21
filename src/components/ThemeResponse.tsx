import React from 'react'
import useIsDark from '../hooks/useIsDark'
import { useThemeMode } from '@rneui/themed'
import useMemoizedFn from '../hooks/useMemoizedFn'

export default function ThemeResponse() {
  const dark = useIsDark()
  const { setMode } = useThemeMode()

  const setMode2 = useMemoizedFn((mode: 'dark' | 'light') => {
    setMode(mode)
  })

  React.useEffect(() => {
    setMode2(dark ? 'dark' : 'light')
  }, [dark, setMode2])
  return null
}
