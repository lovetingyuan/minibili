import type { z } from "zod";

import type { BilibiliAccount } from "../features/bilibili-session/types";
import type { VideoListItemInfo } from "../types";
import type {
  WatchLaterItemSchema,
  WatchLaterResponseSchema,
} from "./watch-later.schema";

export type WatchLaterAccount = Pick<BilibiliAccount, "mid" | "generation">;
export type WatchLaterItem = z.infer<typeof WatchLaterItemSchema>;
export type WatchLaterResponse = z.infer<typeof WatchLaterResponseSchema>;
export type WatchLaterRequest = (url: string) => Promise<unknown>;
export type WatchLaterKey = readonly ["bilibili-watch-later", string, number];
export type WatchLaterChange = { aid: string; added: boolean };
export type WatchLaterRequestDependencies = {
  readCookie: () => Promise<string | null>;
  isCurrentAccount: (account: WatchLaterAccount) => boolean;
};
export type WatchLaterListItem = {
  key: string;
  aid: string;
  title: string;
  video: VideoListItemInfo | null;
  progressRatio: number;
};
