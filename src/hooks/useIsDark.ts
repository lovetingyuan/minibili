import { useColorScheme } from 'react-native'
// import useUpdate from './useUpdate'
import { Appearance } from 'react-native'
import React from 'react'

export default function useIsDark() {
  const [color, setColor] = React.useState(useColorScheme())
  // return true
  const color2 = Appearance.getColorScheme()
  React.useEffect(() => {
    if (color2 !== color) {
      setColor(color2)
    }
  }, [color2, color])
  return color === 'dark'
}
