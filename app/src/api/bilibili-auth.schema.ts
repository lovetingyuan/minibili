import { z } from "zod";

export const BilibiliAuthResponseSchema = z.object({
  code: z.number().int(),
  message: z.string().optional(),
  data: z.unknown().optional(),
});

export const BilibiliProfileSchema = z.object({
  mid: z.number().int().positive(),
  name: z.string(),
  face: z.string(),
});

export const BilibiliMyInfoDataSchema = z.object({
  profile: BilibiliProfileSchema,
  follower: z.number().int().nonnegative().optional(),
});
