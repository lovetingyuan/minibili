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
