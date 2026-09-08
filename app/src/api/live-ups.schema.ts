import { z } from "zod";

const LiveUpItemSchema = z.object({
  link: z.string(),
  is_reserve_recall: z.boolean(),
  mid: z.string(),
  uname: z.string(),
  face: z.string(),
});

export const LiveUpsDataSchema = z.object({
  count: z.number(),
  items: LiveUpItemSchema.array(),
});

export type LiveUpItem = z.infer<typeof LiveUpItemSchema>;
export type LiveUpsData = z.infer<typeof LiveUpsDataSchema>;
