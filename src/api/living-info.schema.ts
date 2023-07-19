import { z } from 'zod'

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
  uname: z.string(),
  face: z.string(),
  tag_name: z.string(),
  tags: z.string(),
  cover_from_user: z.string(),
  keyframe: z.string(),
  broadcast_type: z.number(),
})
