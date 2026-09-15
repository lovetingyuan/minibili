import { z } from "zod";

export const PlayHeartbeatResponseSchema = z.object({
  code: z.number().int(),
  message: z.string().optional(),
  ttl: z.number().optional(),
});
