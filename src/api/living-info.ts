import { z } from 'zod'
// import React from 'react'
import request from './fetcher'
import {
  LiveInfoBatchItemSchema,
  //   LiveInfoResponseSchema,
  //   LiveRoomInfoResponseSchema,
  //   LiveUserInfoResponseSchema,
} from './living-info.schema'
import useSWR from 'swr'
// import useSWRImmutable from 'swr/immutable'
import { useStore } from '../store'
// import store, { useStore } from '../store'

// import { Vibration } from 'react-native'
// import { throttle } from 'throttle-debounce'

// export type LiveRoomInfo = z.infer<typeof LiveRoomInfoResponseSchema>
// export type LiveInfo = z.infer<typeof LiveInfoResponseSchema>
// export type LiveUserInfo = z.infer<typeof LiveUserInfoResponseSchema>
type LiveInfoBatchItem = z.infer<typeof LiveInfoBatchItemSchema>

// const useLiveRoomInfo = (mid: number | string) => {
//   const { data } = useSWRImmutable<LiveRoomInfo>(
//     'https://api.live.bilibili.com/live_user/v1/Master/info?uid=' + mid,
//     request,
//   )
//   return data
// }

// const useLivingInfo = (mid: number | string) => {
//   const roomData = useLiveRoomInfo(mid)
//   const delay = mid.toString().slice(0, 5)
//   const { data, error } = useSWR<LiveInfo>(
//     roomData?.room_id
//       ? 'https://api.live.bilibili.com/room/v1/Room/get_info?room_id=' +
//           roomData.room_id
//       : null,
//     (url: string) => {
//       return queue.add(() => request(url))
//     },
//     {
//       refreshInterval: 10 * 60 * 1000 + Number(delay),
//     },
//   )
//   if (!error && roomData?.room_id && data?.room_id) {
//     const living = data.live_status === 1
//     const liveUrl = 'https://live.bilibili.com/' + data.room_id
//     store.livingUps[mid] = living ? liveUrl : ''
//     return {
//       living,
//       roomId: data.room_id,
//       name: roomData.info.uname,
//       face: roomData.info.face,
//       liveUrl,
//     }
//   }
//   return null
// }

//api.bilibili.com/x/space/wbi/acc/info?mid=3493257772272614&token=&platform=web
// const useLivingInfo2 = (mid: number | string) => {
//   const delay = mid.toString().slice(0, 5)
//   const { data, error } = useSWR<LiveUserInfo>(
//     `/x/space/wbi/acc/info?mid=${mid}&token=&platform=web`,
//     (url: string) => {
//       return queue.add(() => request(url))
//     },
//     {
//       refreshInterval: 10 * 60 * 1000 + Number(delay),
//     },
//   )
//   if (__DEV__ && error) {
//     console.error('living', error)
//   }
//   const living = data?.live_room?.liveStatus === 1
//   const liveUrl = data?.live_room?.url || ''
//   store.livingUps[mid] = living ? liveUrl : ''
//   React.useEffect(() => {
//     if (!!store.livingUps[mid] !== living) {
//       store.livingUps[mid] = living ? liveUrl : ''
//       if (living) {
//         vibrate()
//       }
//     }
//   }, [living, liveUrl, mid])
//   return {
//     data: data
//       ? {
//           hasLiveRoom: !!data.live_room,
//           living,
//           liveUrl,
//           roomId: data.live_room?.roomid,
//           name: data.name,
//           face: data.face,
//         }
//       : null,
//     error,
//   }
// }

export const useLivingInfo3 = () => {
  // api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?uids[]=672328094&uids[]=322892
  const { $followedUps } = useStore()
  const uids = $followedUps
    .map(user => {
      return `uids[]=${user.mid}`
    })
    .join('&')
  const { data, error } = useSWR<Record<string, LiveInfoBatchItem>>(
    uids
      ? `https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?${uids}`
      : null,
    request,
    {
      refreshInterval: 5 * 60 * 1000,
    },
  )
  return {
    data,
    error,
  }
}
