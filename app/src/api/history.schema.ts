import { z } from "zod";

const HistoryIdSchema = z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)]);

export const HistoryCursorSchema = z.object({
  max: HistoryIdSchema,
  view_at: z.number().int().nonnegative(),
  business: z.string(),
});

export const HistoryRecordSchema = z.object({
  title: z.string().nullish(),
  cover: z.string().nullish(),
  author_name: z.string().nullish(),
  author_mid: HistoryIdSchema.nullish(),
  author_face: z.string().nullish(),
  duration: z.number().nullish(),
  view_at: z.number().int().nonnegative(),
  history: z.object({
    business: z.string(),
    oid: HistoryIdSchema.nullish(),
    bvid: z.string().nullish(),
    cid: HistoryIdSchema.nullish(),
    page: z.number().int().nullish(),
  }),
});

export const HistoryResponseSchema = z.object({
  cursor: HistoryCursorSchema,
  list: z.array(HistoryRecordSchema),
});
