import { z } from "zod";

import { FavoriteFolderSchema } from "./favorites.schema";

export const VideoRelationSchema = z.object({
  favorite: z.boolean(),
  // 收藏写入时可能尚未查询点赞状态，保留 undefined 表示未知。
  like: z.boolean().optional(),
});

export const VideoFavoriteFolderSchema = FavoriteFolderSchema.extend({
  fav_state: z.union([z.literal(0), z.literal(1)]),
});

export const VideoFavoriteFoldersSchema = z.object({
  count: z.number().int().nonnegative(),
  list: z
    .array(VideoFavoriteFolderSchema)
    .nullish()
    .transform((list) => list ?? []),
});

export const FavoriteDealResponseSchema = z.object({
  code: z.number().int(),
  message: z.string().optional(),
  data: z.unknown().optional(),
});

export const FavoriteDealDataSchema = z.object({
  prompt: z.boolean(),
  ga_data: z.unknown().optional(),
  toast_msg: z.string(),
  success_num: z.number(),
});
