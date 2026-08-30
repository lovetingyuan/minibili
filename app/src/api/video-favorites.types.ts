import type { z } from "zod";

import type { FavoriteAccount } from "./favorites.types";
import type {
  VideoFavoriteFolderSchema,
  VideoFavoriteFoldersSchema,
  VideoRelationSchema,
} from "./video-favorites.schema";

export type FavoriteVideo = { aid: string; bvid: string };
export type VideoRelation = z.infer<typeof VideoRelationSchema>;
export type VideoFavoriteFolder = z.infer<typeof VideoFavoriteFolderSchema>;
export type VideoFavoriteFolders = z.infer<typeof VideoFavoriteFoldersSchema>;
export type VideoFavoriteChange = {
  video: FavoriteVideo;
  initialIds: number[];
  selectedIds: number[];
};
export type VideoFavoriteRequestDependencies = {
  readCookie: () => Promise<string | null>;
  isCurrentAccount: (account: FavoriteAccount) => boolean;
};
export type VideoRelationKey = readonly ["bilibili-video-relation", string, number, string, string];
export type VideoFavoriteFoldersKey = readonly [
  "bilibili-video-favorite-folders",
  string,
  number,
  string,
  string,
];
