import React from 'react'
import { useCheckLivingUps } from '../api/living-info'
import store from '../store'

export default React.memo(function CheckLive() {
  const liveMap = useCheckLivingUps()
  // React.useEffect(() => {
  //   if (liveMap) {
  //     store.livingUps = liveMap
  //   }
  // }, [liveMap])
  return null
})
