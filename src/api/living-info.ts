import { z } from 'zod'
import request from './fetcher'
import {
  LiveInfoResponseSchema,
  LiveRoomInfoResponseSchema,
} from './living-info.schema'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'
import PQueue from 'p-queue'
import store from '../store'

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
    const living = data.live_status === 1
    const liveUrl = 'https://live.bilibili.com/' + data.room_id
    store.livingUps[mid] = living ? liveUrl : ''
    return {
      living,
      roomId: data.room_id,
      name: roomData.info.uname,
      face: roomData.info.face,
      liveUrl,
    }
  }
  return null
}

// https://api.bilibili.com/x/space/wbi/acc/info?mid=3493257772272614&token=&platform=web
export const useLivingInfo2 = (mid: number | string) => {
  const delay = mid.toString().slice(0, 5)
  const { data, error } = useSWR<{
    mid: number
    name: string
    sex: string
    face: string
    sign: string
    birthday: string
    live_room: {
      roomStatus: number
      liveStatus: number
      url: string
      title: string
      cover: string
      roomid: number
    }
  }>(
    `/x/space/wbi/acc/info?mid=${mid}&token=&platform=web`,
    (url: string) => {
      return queue.add(() => request(url))
    },
    {
      refreshInterval: 10 * 60 * 1000 + Number(delay),
    },
  )
  if (__DEV__ && error) {
    console.error('liveing', error)
  }
  return {
    data: data
      ? {
          living: data.live_room.liveStatus === 1,
          liveUrl: data.live_room.url,
          roomId: data.live_room.roomid,
          name: data.name,
          face: data.face,
        }
      : null,
    error,
  }
}
