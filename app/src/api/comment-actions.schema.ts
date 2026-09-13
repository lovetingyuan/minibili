import { z } from "zod";

import { BaseCommentSchema } from "./comments.schema";

export const CommentActionResponseSchema = z.object({
  code: z.number().int(),
  message: z.string().optional().default(""),
  ttl: z.number().optional(),
  data: z.unknown().nullish(),
});

export const AddCommentReplyResponseSchema = z.object({
  code: z.number().int(),
  message: z.string().optional().default(""),
  ttl: z.number().optional(),
  data: z.object({ reply: BaseCommentSchema }).nullish(),
});
