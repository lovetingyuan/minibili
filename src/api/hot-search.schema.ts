import { z } from 'zod'

export const HotSearchSchema = z.object({
  trackid: z.string(),
  list: z
    .object({
      hot_id: z.number(),
      icon: z.string().nullish(),
      is_commercial: z.union([z.literal('0'), z.literal('1')]),
      keyword: z.string(),
      position: z.number(),
      show_name: z.string(),
      word_type: z.number(),
    })
    .array(),
})

export type HotSearchResType = z.infer<typeof HotSearchSchema>
