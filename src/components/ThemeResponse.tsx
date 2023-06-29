// import React from 'react'
import { useColorScheme } from 'react-native'
// import useIsDark from '../hooks/useIsDark'
import { useThemeMode } from '@rneui/themed'
// import useMemoizedFn from '../hooks/useMemoizedFn'

export default function ThemeResponse() {
  const { setMode, mode } = useThemeMode()
  const color = useColorScheme()
  // const isDark = useIsDark()
  // const setMode2 = useMemoizedFn((t: 'light' | 'dark') => {
  //   setMode(t)
  // })
  if (typeof color === 'string' && color !== mode) {
    setMode(color)
  }
  // if (isDark) {
  //   if (mode === 'light') {
  //     setMode('dark')
  //   }
  // } else {
  //   if (mode === 'dark') {
  //     setMode('light')
  //   }
  // }
  return null
}
