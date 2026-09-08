import { z } from "zod";

const FollowingItemSchema = z.object({
  mid: z.number(),
  uname: z.string(),
  face: z.string(),
  sign: z.string(),
});

export const FollowingsDataSchema = z.object({
  list: FollowingItemSchema.array(),
  total: z.number().int().nonnegative(),
});

export type FollowingItem = z.infer<typeof FollowingItemSchema>;
