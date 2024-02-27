import { NetInfoStateType, useNetInfo } from '@react-native-community/netinfo'
import React from 'react'

import { useStore } from '../store'
import { showToast } from '../utils'

export default React.memo(NetState)

function NetState() {
  const { setIsWiFi } = useStore()
  const { type, isConnected } = useNetInfo()
  const isWifi = type === NetInfoStateType.wifi

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!isConnected) {
        showToast('当前网络状况不佳')
      } else if (!isWifi) {
        setIsWiFi(false)
        showToast('请注意当前网络不是 WiFi')
      } else {
        setIsWiFi(true)
      }
    }, 3000)
    // setIsWiFi(isWifi)
    return () => {
      clearTimeout(timer)
    }
  }, [isWifi, isConnected, setIsWiFi])

  return null
}
