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
  live_status: z.union([z.literal(0), z.literal(1), z.literal(2)]),
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

export const LiveInfoBatchItemSchema = z.object({
  title: z.string(),
  room_id: z.number(),
  uid: z.number(),
  online: z.number(),
  live_time: z.number(),
  live_status: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  short_id: z.number(),
  area: z.number(),
  area_name: z.string(),
  // area_v2_id: 743,
  // area_v2_name:z.string(),
  // area_v2_parent_name: '虚拟主播',
  // area_v2_parent_id: 9,
  uname: z.string(),
  face: z.string(),
  tag_name: z.string(),
  tags: z.string(),
  cover_from_user: z.string(),
  keyframe: z.string(),
  // lock_till: '0000-00-00 00:00:00',
  // hidden_till: '0000-00-00 00:00:00',
  broadcast_type: z.number(),
})
