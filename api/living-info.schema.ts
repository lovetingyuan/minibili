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
