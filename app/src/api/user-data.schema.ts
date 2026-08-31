import { z } from "zod";

export const UserDataResponseSchema = z.object({
  success: z.literal(true),
  uid: z.string().regex(/^[1-9]\d*$/),
  result: z.record(z.string(), z.json()),
});
