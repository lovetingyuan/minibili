import { z } from "zod";

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
    official_verify: z
      .object({
        type: z.number(),
        desc: z.string(),
      })
      .nullish(),
    level_info: z.object({
      current_level: z.number(),
    }),
    vip: z.object({
      status: z.number(),
    }),
  }),
  following: z.boolean(),
  follower: z.number(),
});
