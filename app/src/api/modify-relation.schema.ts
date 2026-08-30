import { z } from "zod";

export const ModifyRelationResponseSchema = z.object({
  code: z.number().int(),
  message: z.string().optional(),
});
