import { z } from "zod";

export const DynamicLikeResponseSchema = z.looseObject({
  code: z.number(),
  message: z.string().default(""),
});
