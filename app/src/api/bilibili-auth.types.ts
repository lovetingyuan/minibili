import type { z } from "zod";

import type { BilibiliMyInfoDataSchema, BilibiliProfileSchema } from "./bilibili-auth.schema";

export type BilibiliProfile = z.infer<typeof BilibiliProfileSchema> &
  Pick<z.infer<typeof BilibiliMyInfoDataSchema>, "follower">;
