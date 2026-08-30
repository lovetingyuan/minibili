import type { z } from "zod";

import type { FavoriteAccount } from "./favorites.types";
import type { FavoriteVideo } from "./video-favorites.types";
import type { VideoInfoResponseSchema } from "./video-info.schema";

export type VideoLikeChange = { video: FavoriteVideo; liked: boolean };
export type VideoLikeRequestDependencies = {
  readCookie: () => Promise<string | null>;
  isCurrentAccount: (account: FavoriteAccount) => boolean;
};
export type VideoInfoResponse = z.infer<typeof VideoInfoResponseSchema>;
