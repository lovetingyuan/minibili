import { z } from "zod";

const StringOrNumberSchema = z.union([z.string(), z.number()]);

export const FollowingDynamicsNavItemSchema = z
  .object({
    author: z
      .object({
        mid: StringOrNumberSchema,
      })
      .passthrough(),
    id_str: StringOrNumberSchema,
    visible: z.boolean().optional(),
  })
  .passthrough();

export const FollowingDynamicsNavResponseSchema = z
  .object({
    has_more: z.boolean().default(false),
    items: z.array(FollowingDynamicsNavItemSchema).default([]),
    offset: z.string().nullish(),
    update_baseline: z.string().nullish(),
    update_num: StringOrNumberSchema.optional(),
  })
  .passthrough();

export type FollowingDynamicsNavResponse = z.infer<typeof FollowingDynamicsNavResponseSchema>;
