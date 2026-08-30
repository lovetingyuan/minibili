import type { z } from "zod";

import type { BilibiliAccount } from "../features/bilibili-session/types";
import type { VideoListItemInfo } from "../types";
import type {
  FavoriteFolderSchema,
  FavoriteFoldersSchema,
  FavoriteResourceSchema,
  FavoriteResourcesSchema,
} from "./favorites.schema";

export type FavoriteAccount = Pick<BilibiliAccount, "mid" | "generation">;
export type FavoriteFolder = z.infer<typeof FavoriteFolderSchema>;
export type FavoriteFolders = z.infer<typeof FavoriteFoldersSchema>;
export type FavoriteResource = z.infer<typeof FavoriteResourceSchema>;
export type FavoriteResources = z.infer<typeof FavoriteResourcesSchema>;
export type FavoriteRequest = (url: string) => Promise<unknown>;
export type FavoriteFoldersKey = readonly ["bilibili-favorite-folders", string, number];
export type FavoriteResourcesKey = readonly [
  "bilibili-favorite-resources",
  string,
  number,
  number,
  number,
];
export type FavoriteResourcesKeyLoader = (
  index: number,
  previousPage: FavoriteResources | null,
) => FavoriteResourcesKey | null;
export type FavoriteListItem = {
  key: string;
  title: string;
  video: VideoListItemInfo | null;
};
