import { z } from 'zod'

export const LiveRoomInfoResponseSchema = z.object({
  room_id: z.number(),
  info: z.object({
    face: z.string(),
    uid: z.number(),
    uname: z.string(),
  }),
})

export const LiveInfoResponseSchema = z.object({
  uid: z.number(),
  room_id: z.number(),
  attention: z.number(),
  online: z.number(),
  description: z.string(),
  live_status: z.number(),
  title: z.string(),
  user_cover: z.string(),
  is_strict_room: z.boolean(),
  live_time: z.string(),
})

export const LiveUserInfoResponseSchema = z.object({
  mid: z.number(),
  name: z.string(),
  sex: z.string(),
  face: z.string(),
  sign: z.string(),
  birthday: z.string(),
  live_room: z
    .object({
      roomStatus: z.number(),
      liveStatus: z.number(),
      url: z.string(),
      title: z.string(),
      cover: z.string(),
      roomid: z.number(),
    })
    .optional(),
})
