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
  is_followed: z.boolean(),
  is_risk: z.boolean(),
  live_room: z
    .object({
      roomStatus: z.number(),
      liveStatus: z.number(),
      url: z.string(),
      title: z.string(),
      cover: z.string(),
      roomid: z.number(),
      roundStatus: z.number(),
    })
    .nullable(),
})

export const UserCardInfoResponseSchema = z.object({
  card: z.object({
    mid: z.string(),
    name: z.string(),
    sex: z.string(),
    face: z.string(),
    birthday: z.string(),
    place: z.string(),
    description: z.string(),
    fans: z.number(),
    friend: z.number(),
    attention: z.number(),
    sign: z.string(),
    level_info: z.object({
      current_level: z.number(),
    }),
    vip: z.object({
      status: z.number(),
    }),
  }),
  following: z.boolean(),
  follower: z.number(),
})

export const UserBatchInfoResponseSchema = z
  .object({
    mid: z.number(),
    name: z.string(),
    sex: z.string(),
    face: z.string(),
    sign: z.string(),
    level: z.number(),
    birthday: z.number(),
    vip: z.object({
      status: z.number(),
    }),
  })
  .array()
