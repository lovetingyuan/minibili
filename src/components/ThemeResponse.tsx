import React from 'react'
import useIsDark from '../hooks/useIsDark'
import { useThemeMode } from '@rneui/themed'
// import useMemoizedFn from '../hooks/useMemoizedFn'

export default function ThemeResponse() {
  const dark = useIsDark()
  const { setMode } = useThemeMode()

  React.useEffect(() => {
    setMode(dark ? 'dark' : 'light')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dark])
  return null
}
