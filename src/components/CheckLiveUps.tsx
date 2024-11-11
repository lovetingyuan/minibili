import React from 'react'
import { Vibration } from 'react-native'
import useSWR from 'swr'
import type { z } from 'zod'

import type { LiveInfoBatchItemSchema } from '../api/living-info.schema'
import { useStore } from '../store'

type LivingUpsData = Record<string, z.infer<typeof LiveInfoBatchItemSchema>>

const useCheckLivingUps = (time?: number) => {
  const { $followedUps, setLivingUps, checkLiveTimeStamp } = useStore()
  const uids = $followedUps.map((user) => `uids[]=${user.mid}`).join('&')
  const url = uids
    ? `https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?${uids}&_t=${checkLiveTimeStamp}`
    : null
  const prevLivingMapRef = React.useRef({})

  useSWR<LivingUpsData>(url, {
    refreshInterval: time || 5 * 60 * 1000,
    errorRetryCount: 2,
    refreshWhenHidden: true, // 在移动端后台刷新不能保证会一直按时执行
    onSuccess: (data: LivingUpsData) => {
      if (!data) {
        return
      }
      const livingMap: Record<string, string> = {}
      Object.keys(data).forEach((mid) => {
        // https://live.bilibili.com/h5/24446464
        const { live_status, room_id } = data[mid]
        if (live_status === 1) {
          livingMap[mid] = `https://live.bilibili.com/h5/${room_id}`
        }
      })
      let notVibrate = true
      for (const id in livingMap) {
        if (!(id in prevLivingMapRef.current) && notVibrate) {
          Vibration.vibrate(900)
          notVibrate = false
          break
        }
      }
      prevLivingMapRef.current = livingMap
      setLivingUps(livingMap)
    },
  })
}

export default React.memo(CheckLiveUps)

function CheckLiveUps() {
  useCheckLivingUps()
  return null
}
