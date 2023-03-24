import NetInfo from '@react-native-community/netinfo'
import React from 'react'

export function useIsWifi() {
  const [isWifi, setIsWifi] = React.useState<boolean | null>(null)
  React.useEffect(() => {
    NetInfo.fetch().then(state => {
      setIsWifi(state.type === 'wifi')
    })
  }, [])
  return isWifi
}
