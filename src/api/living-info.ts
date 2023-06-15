import { z } from 'zod'
import request from './fetcher'
import { LiveInfoBatchItemSchema } from './living-info.schema'
import useSWR from 'swr'
import { useStore } from '../store'
// import React from 'react'

// https://api.live.bilibili.com/live_user/v1/Master/info?uid=
// https://api.live.bilibili.com/room/v1/Room/get_info?room_id=
// api.bilibili.com/x/space/wbi/acc/info?mid=3493257772272614&token=&platform=web
const livingMapRef: { current: Record<string, string> } = {
  current: {},
}

export const useLivingInfo = () => {
  // api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?uids[]=672328094&uids[]=322892
  const { $followedUps } = useStore()
  const uids = $followedUps
    .map(user => {
      return `uids[]=${user.mid}`
    })
    .join('&')
  const { data, error } = useSWR<
    Record<string, z.infer<typeof LiveInfoBatchItemSchema>>
  >(
    uids
      ? `https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?${uids}`
      : null,
    request,
    {
      refreshInterval: 5 * 60 * 1000,
    },
  )
  if (data) {
    const livingMap: Record<string, string> = {}
    Object.keys(data).forEach(mid => {
      // https://live.bilibili.com/h5/24446464
      const { live_status, room_id } = data[mid]
      const living = live_status === 1
      const url = 'https://live.bilibili.com/h5/' + room_id
      livingMap[mid] = living ? url : ''
      // if (living) {
      //   vibrate()
      // }
    })
    if (JSON.stringify(livingMap) !== JSON.stringify(livingMapRef.current)) {
      livingMapRef.current = livingMap
    }
    // store.livingUps = livingMap2
  }
  return {
    data: livingMapRef.current,
    error,
  }
}
