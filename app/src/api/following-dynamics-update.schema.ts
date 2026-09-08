import { z } from "zod";

const StringOrNumberSchema = z.union([z.string(), z.number()]);

export const FollowingDynamicsUpdateCountSchema = z
  .object({
    update_num: StringOrNumberSchema.optional().default(0),
  })
  .passthrough();

export type FollowingDynamicsUpdateCount = z.infer<typeof FollowingDynamicsUpdateCountSchema>;
