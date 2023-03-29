import { useNetInfo } from '@react-native-community/netinfo'
import React from 'react'
import { ToastAndroid } from 'react-native'

export function NetToast() {
  const netInfo = useNetInfo()
  React.useEffect(() => {
    if (netInfo.isConnected === false) {
      ToastAndroid.show(' 网络状况不佳 ', ToastAndroid.SHORT)
    } else {
      if (netInfo.type !== 'wifi' && netInfo.type !== 'unknown') {
        ToastAndroid.showWithGravity(
          ' 请注意当前网络不是 wifi ',
          ToastAndroid.LONG,
          ToastAndroid.CENTER,
        )
      }
    }
  }, [netInfo.isConnected, netInfo.type])
  return null
}
