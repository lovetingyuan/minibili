import { NetInfoStateType, useNetInfo } from '@react-native-community/netinfo'
import { useStore } from '../store'
import { showToast } from '../utils'
import React from 'react'

export default React.memo(function NetState() {
  const { setIsWiFi } = useStore()
  const toasted = React.useRef(false)
  const { type, isConnected } = useNetInfo()
  React.useEffect(() => {
    if (!isConnected) {
      return
    }
    const wifi = type === NetInfoStateType.wifi
    setIsWiFi(wifi)
    if (!wifi && !toasted.current) {
      toasted.current = true
      showToast('请注意当前网络不是Wifi')
    }
    const timer = setTimeout(() => {
      toasted.current = false
    }, 30 * 1000)
    return () => {
      clearTimeout(timer)
    }
  }, [type, isConnected, setIsWiFi])

  return null
})
