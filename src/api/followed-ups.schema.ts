import { z } from 'zod'

export const FollowedUpResponseSchema = z.object({
  face: z.string(),
  mid: z.union([z.number(), z.string()]),
  mtime: z.number(),
  // official_verify: { type: number; desc: string }
  sign: z.string(),
  // special: 0;
  // tag: null
  uname: z.string(),
})

export const FollowedUpDataResponseSchema = z.object({
  total: z.number(),
  list: FollowedUpResponseSchema.array(),
})
