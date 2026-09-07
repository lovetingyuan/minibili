import { z } from "zod";

export const DynamicLikeResponseSchema = z
  .object({
    code: z.number(),
    message: z.string().default(""),
  })
  .passthrough();
