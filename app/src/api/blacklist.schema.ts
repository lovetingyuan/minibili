import { z } from "zod";

export const BlacklistDataSchema = z.object({
  list: z.array(
    z.object({
      mid: z.number().int().positive(),
      uname: z.string(),
      face: z.string(),
      sign: z.string(),
    }),
  ),
  re_version: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
