import { z } from 'zod'

export const WatchingCountResponseSchema = z.object({
  total: z.string(),
  count: z.string(),
  show_switch: z.object({
    total: z.boolean(),
    count: z.boolean(),
  }),
  // abtest: {
  //   group: 'b',
  // },
})

export type WatchingCountResponseType = z.infer<
  typeof WatchingCountResponseSchema
>
