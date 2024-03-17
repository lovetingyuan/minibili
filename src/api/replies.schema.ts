import { z } from 'zod'

import { BaseCommentSchema } from './comments.schema'

export type ReplyResItem = z.infer<typeof BaseCommentSchema>

const RepliesSchema: z.ZodType<ReplyResItem> = BaseCommentSchema

export const ReplyResponseSchema = z.object({
  page: z.object({
    num: z.number(),
    size: z.number(),
    count: z.number(),
  }),
  replies: RepliesSchema.array(),
  root: RepliesSchema,
  upper: z.object({ mid: z.number() }),
})
