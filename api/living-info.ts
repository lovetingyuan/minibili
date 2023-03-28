import { z } from 'zod'
import request from './fetcher'
import {
  LiveInfoResponseSchema,
  LiveUserInfoResponseSchema,
} from './living-info.schema'

export type LiveUserInfo = z.infer<typeof LiveUserInfoResponseSchema>
export type LiveInfo = z.infer<typeof LiveInfoResponseSchema>

export const getLivingInfo = async (mid: number | string) => {
  const {
    room_id,
    info: { uname, face },
  } = await request<LiveUserInfo>(
    'https://api.live.bilibili.com/live_user/v1/Master/info?uid=' + mid,
  )
  if (!room_id) {
    return {
      living: false,
      roomId: '',
      name: uname,
      face,
    }
  }

  const { live_status } = await request<LiveInfo>(
    'https://api.live.bilibili.com/room/v1/Room/get_info?room_id=' + room_id,
  )
  return {
    living: live_status === 1,
    roomId: room_id,
    name: uname,
    face,
  }
}

// https://api.bilibili.com/x/space/wbi/acc/info?mid=3493257772272614&token=&platform=web
// export function _getLivingInfo(mid: string | number) {
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
