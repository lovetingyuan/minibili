import { z } from "zod";

const WatchLaterIdSchema = z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)]);

export const WatchLaterItemSchema = z.object({
  aid: WatchLaterIdSchema,
  bvid: z.string().nullish(),
  title: z.string().nullish(),
  pic: z.string().nullish(),
  duration: z.number().nullish(),
  progress: z.number().nullish(),
  viewed: z.boolean().nullish(),
  owner: z
    .object({
      mid: WatchLaterIdSchema.nullish(),
      name: z.string().nullish(),
      face: z.string().nullish(),
    })
    .nullish(),
  stat: z
    .object({
      view: z.number().nullish(),
      danmaku: z.number().nullish(),
    })
    .nullish(),
});

export const WatchLaterResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  list: z
    .array(WatchLaterItemSchema)
    .nullish()
    .transform((list) => list ?? []),
});

export const WatchLaterActionResponseSchema = z.object({
  code: z.number().int(),
  message: z.string().optional(),
});
