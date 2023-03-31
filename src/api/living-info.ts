import { z } from 'zod'
import request from './fetcher'
import {
  LiveInfoResponseSchema,
  LiveRoomInfoResponseSchema,
} from './living-info.schema'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'
import PQueue from 'p-queue'

export type LiveRoomInfo = z.infer<typeof LiveRoomInfoResponseSchema>
export type LiveInfo = z.infer<typeof LiveInfoResponseSchema>

const queue = new PQueue({ concurrency: 3 })

export const useLiveRoomInfo = (mid: number | string) => {
  const { data } = useSWRImmutable<LiveRoomInfo>(
    'https://api.live.bilibili.com/live_user/v1/Master/info?uid=' + mid,
    request,
  )
  return data
}

export const useLivingInfo = (mid: number | string) => {
  const roomData = useLiveRoomInfo(mid)
  const delay = mid.toString().slice(0, 5)
  const { data, error } = useSWR<LiveInfo>(
    roomData?.room_id
      ? 'https://api.live.bilibili.com/room/v1/Room/get_info?room_id=' +
          roomData.room_id
      : null,
    (url: string) => {
      return queue.add(() => request(url))
    },
    {
      refreshInterval: 10 * 60 * 1000 + Number(delay),
    },
  )
  if (!error && roomData?.room_id && data?.room_id) {
    return {
      living: data.live_status === 1,
      roomId: data.room_id,
      name: roomData.info.uname,
      face: roomData.info.face,
      liveUrl: 'https://live.bilibili.com/' + data.room_id,
    }
  }
  return null
}

// https://api.bilibili.com/x/space/wbi/acc/info?mid=3493257772272614&token=&platform=web
// export function getLivingInfo(mid: string | number) {
//   return request<{
//     live_room: {
//       roomStatus: number
//       liveStatus: number
//       url: string
//       title: string
//       cover: string
//       roomid: number
//     }
//   }>(`/x/space/wbi/acc/info?mid=${mid}&token=&platform=web`).then(data => {
//     return {
//       living: data.live_room.liveStatus === 1,
//       roomId: data.live_room.roomid,
//       roomEnable: data.live_room.roomStatus === 1,
//     }
//   })
// }
