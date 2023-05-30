import { useColorScheme } from 'react-native'
import useUpdate from './useUpdate'
import { Appearance } from 'react-native'

export default function useIsDark() {
  const color = useColorScheme()
  const update = useUpdate()
  // return true
  const color2 = Appearance.getColorScheme()
  if (color2 !== color) {
    update()
    return color2 === 'dark'
  }
  return color === 'dark'
}
