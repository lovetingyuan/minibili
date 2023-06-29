import { useColorScheme } from 'react-native'
// import { Appearance } from 'react-native'
// import React from 'react'

export default function useIsDark() {
  return useColorScheme() === 'dark'
  // const [color, setColor] = React.useState(useColorScheme())
  // // return true
  // // const color2 = Appearance.getColorScheme()
  // React.useEffect(() => {
  //   Appearance.addChangeListener(({ colorScheme }) => setColor(colorScheme))
  // }, [])
  // return color === 'dark'
}
