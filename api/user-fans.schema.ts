import { z } from 'zod'

export const UserFansResponseSchema = z.object({
  mid: z.number(),
  following: z.number(),
  whisper: z.number(),
  black: z.number(),
  follower: z.number(),
})
