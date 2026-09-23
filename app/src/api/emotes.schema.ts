import { z } from "zod";

const EmoteSchema = z
  .object({
    text: z.string().default(""),
    url: z.string().default(""),
  })
  .passthrough();

const EmotePackageSchema = z
  .object({
    id: z.number().default(0),
    text: z.string().default(""),
    emote: z.array(EmoteSchema).default([]),
  })
  .passthrough();

/** `/x/emote/package` 的 `data`；请求的 ids 全部无效时 `packages` 为 null。 */
export const EmotePackagesResponseSchema = z
  .object({
    packages: z.array(EmotePackageSchema).nullish(),
  })
  .passthrough();

export type EmotePackagesResponse = z.infer<typeof EmotePackagesResponseSchema>;
