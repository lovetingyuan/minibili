import { useColorScheme } from 'react-native'

export default function useIsDark() {
  return useColorScheme() === 'dark'
}
