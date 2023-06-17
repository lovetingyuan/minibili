import { z } from 'zod'
import request from './fetcher'
import { LiveInfoBatchItemSchema } from './living-info.schema'
import store from '../store'
import { throttle } from 'throttle-debounce'
import { Vibration } from 'react-native'
// import { subscribeKey } from 'valtio/utils'
import useSWR from 'swr'
// import store, { useStore } from '../store'
// import React from 'react'

// https://api.live.bilibili.com/live_user/v1/Master/info?uid=
// https://api.live.bilibili.com/room/v1/Room/get_info?room_id=
// api.bilibili.com/x/space/wbi/acc/info?mid=3493257772272614&token=&platform=web
// const livingMapRef: { current: Record<string, string> } = {
//   current: {},
// }

export const useLivingInfo = (mid?: string | number) => {
  // api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?uids[]=672328094&uids[]=322892
  const { data } = useSWR<
    Record<string, z.infer<typeof LiveInfoBatchItemSchema>>
  >(
    mid
      ? `https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?uids[]=${mid}`
      : null,
    request,
    {
      refreshInterval: 5 * 60 * 1000,
    },
  )
  if (data && mid) {
    const { live_status, room_id } = data?.[mid] || {}
    return {
      livingUrl:
        live_status === 1 ? 'https://live.bilibili.com/h5/' + room_id : '',
    }
  }
  return {
    livingUrl: '',
  }
}

let prevLivingMap: Record<string, string> = {}

const vibrate = throttle(
  10000,
  () => {
    Vibration.vibrate(900)
  },
  {
    noLeading: false,
    noTrailing: false,
  },
)

export const checkLivingUps = () => {
  // api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?uids[]=672328094&uids[]=322892
  if (!store.$followedUps.length) {
    store.livingUps = {}
    return
  }
  const uids = store.$followedUps.map(user => `uids[]=${user.mid}`).sort()
  const url = `https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?${uids.join(
    '&',
  )}`
  return request<Record<string, z.infer<typeof LiveInfoBatchItemSchema>>>(
    url,
  ).then(data => {
    const livingMap: Record<string, string> = {}
    Object.keys(data).forEach(mid => {
      // https://live.bilibili.com/h5/24446464
      const { live_status, room_id } = data[mid]
      if (live_status === 1) {
        livingMap[mid] = 'https://live.bilibili.com/h5/' + room_id
      }
    })
    for (const id in livingMap) {
      if (!(id in prevLivingMap)) {
        vibrate()
        break
      }
    }
    prevLivingMap = livingMap
    store.livingUps = livingMap
  })
}
