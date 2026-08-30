import { z } from "zod";

export const FavoriteFolderSchema = z.object({
  id: z.number().int().positive(),
  fid: z.number().int(),
  mid: z.number().int(),
  title: z.string(),
  media_count: z.number().int().nonnegative(),
});

export const FavoriteFoldersSchema = z.object({
  count: z.number().int().nonnegative(),
  list: z
    .array(FavoriteFolderSchema)
    .nullish()
    .transform((list) => list ?? []),
});

export const FavoriteResourceSchema = z.object({
  id: z.number().int(),
  type: z.number().int(),
  title: z.string(),
  cover: z.string().nullish(),
  intro: z.string().nullish(),
  duration: z.number().nullish(),
  pubtime: z.number().nullish(),
  fav_time: z.number().nullish(),
  bvid: z.string().nullish(),
  bv_id: z.string().nullish(),
  upper: z
    .object({
      mid: z.number().int(),
      name: z.string(),
      face: z.string().nullish(),
    })
    .nullish(),
  cnt_info: z
    .object({
      play: z.number().nullish(),
      danmaku: z.number().nullish(),
    })
    .nullish(),
});

export const FavoriteResourcesSchema = z.object({
  info: FavoriteFolderSchema,
  medias: z
    .array(FavoriteResourceSchema)
    .nullish()
    .transform((medias) => medias ?? []),
  has_more: z.boolean(),
});
