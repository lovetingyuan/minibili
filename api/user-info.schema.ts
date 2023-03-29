import { z } from 'zod'

export const UserInfoResponseSchema = z.object({
  birthday: z.string(),
  coins: z.number(),
  face: z.string(),
  level: z.number(),
  mid: z.number(),
  name: z.string(),
  sex: z.string(),
  sign: z.string(),
})

// export const UserRelationResponseSchema = z.object({
//   mid: z.number(),
//   following: z.number(),
//   whisper: z.number(),
//   black: z.number(),
//   follower: z.number(),
// })
