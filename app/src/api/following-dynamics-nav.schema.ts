import { z } from "zod";

const StringOrNumberSchema = z.union([z.string(), z.number()]);

export const FollowingDynamicsNavItemSchema = z.looseObject({
  id_str: StringOrNumberSchema,
});

export const FollowingDynamicsNavResponseSchema = z.looseObject({
  has_more: z.boolean().default(false),
  items: z.array(FollowingDynamicsNavItemSchema).default([]),
  offset: z.string().nullish(),
  update_baseline: z.string().nullish(),
  update_num: StringOrNumberSchema.optional(),
});

export type FollowingDynamicsNavResponse = z.infer<typeof FollowingDynamicsNavResponseSchema>;
