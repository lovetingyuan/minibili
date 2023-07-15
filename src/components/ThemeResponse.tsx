import { useColorScheme } from 'react-native'
import { useThemeMode } from '@rneui/themed'

export default function ThemeResponse() {
  const { setMode, mode } = useThemeMode()
  const color = useColorScheme()
  if (typeof color === 'string' && color !== mode) {
    setMode(color)
  }
  return null
}
