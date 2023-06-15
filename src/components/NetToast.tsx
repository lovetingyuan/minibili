import { useNetInfo } from '@react-native-community/netinfo'
import React from 'react'
import { showToast } from '../utils'

export default React.memo(function NetToast() {
  const netInfo = useNetInfo()
  React.useEffect(() => {
    if (netInfo.isConnected === false) {
      showToast(' 网络状况不佳 ')
    } else {
      if (netInfo.type !== 'wifi' && netInfo.type !== 'unknown') {
        showToast(' 请注意当前网络不是 wifi ')
      }
    }
  }, [netInfo.isConnected, netInfo.type])
  return null
})
