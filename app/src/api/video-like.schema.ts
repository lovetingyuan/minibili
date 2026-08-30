import { z } from "zod";

export const VideoLikeResponseSchema = z.object({
  code: z.number().int(),
  message: z.string().optional(),
});
