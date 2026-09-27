import { z } from "zod";

export const appReleaseSchema = z.object({
  version: z.string(),
  changelog: z.string().catch(""),
});

export const appReleaseResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.array(appReleaseSchema),
});
