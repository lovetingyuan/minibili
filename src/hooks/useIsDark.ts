import { useColorScheme } from 'react-native'

export default function useIsDark() {
  const color = useColorScheme()
  // return true
  return color === 'dark'
}
