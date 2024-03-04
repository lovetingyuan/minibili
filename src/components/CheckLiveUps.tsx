import React from 'react'
import { Vibration } from 'react-native'
import useSWR from 'swr'
import type { z } from 'zod'

import request from '../api/fetcher'
import type { LiveInfoBatchItemSchema } from '../api/living-info.schema'
import { useStore } from '../store'

let prevLivingMap = {}

const useCheckLivingUps = (time?: number) => {
  const { $followedUps, setLivingUps, checkLiveTimeStamp } = useStore()
  const uids = $followedUps.map(user => `uids[]=${user.mid}`).join('&')
  const url = uids
    ? `https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?${uids}&_t=${checkLiveTimeStamp}`
    : null
  useSWR<Record<string, z.infer<typeof LiveInfoBatchItemSchema>>>(
    url,
    request,
    {
      refreshInterval: time || 5 * 60 * 1000,
      errorRetryCount: 2,
      refreshWhenHidden: true,
      onSuccess(data) {
        if (!data) {
          return
        }
        const livingMap: Record<string, string> = {}
        Object.keys(data).forEach(mid => {
          // https://live.bilibili.com/h5/24446464
          const { live_status, room_id } = data[mid]
          if (live_status === 1) {
            livingMap[mid] = 'https://live.bilibili.com/h5/' + room_id
          }
        })
        let notVibrate = true
        for (const id in livingMap) {
          if (!(id in prevLivingMap) && notVibrate) {
            Vibration.vibrate(900)
            notVibrate = false
            break
          }
        }
        prevLivingMap = livingMap
        setLivingUps(livingMap)
      },
    },
  )
}

export default React.memo(CheckLiveUps)

function CheckLiveUps() {
  useCheckLivingUps()
  return null
}
