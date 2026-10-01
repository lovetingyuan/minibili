import { z } from "zod";

export const appReleaseSchema = z.object({
  version: z.string(),
  changelog: z.string().catch(""),
  downloadUrl: z.url(),
});
