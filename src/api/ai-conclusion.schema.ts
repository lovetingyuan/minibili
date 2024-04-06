import { z } from 'zod'

export const AiConclusionSchema = z.object({
  code: z.number(),
  stid: z.string(),
  status: z.number(),
  like_num: z.number(),
  dislike_num: z.number(),
  model_result: z.object({
    result_type: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    summary: z.string(),
  }),
})

export type AiConclusionResType = z.infer<typeof AiConclusionSchema>
