import type { z } from "zod";

import type { BilibiliAccount } from "../features/bilibili-session/types";
import type { VideoListItemInfo } from "../types";
import type { HistoryCursorSchema, HistoryResponseSchema } from "./history.schema";

export type HistoryAccount = Pick<BilibiliAccount, "mid" | "generation">;
export type HistoryCursor = z.infer<typeof HistoryCursorSchema>;
export type HistoryResponse = z.infer<typeof HistoryResponseSchema>;
export type HistoryPage = HistoryResponse & { hasMore: boolean; chainId: number };
export type HistoryRequest = (url: string) => Promise<unknown>;
export type HistoryKey = readonly [
  "bilibili-history",
  string,
  number,
  string,
  number,
  string,
  number,
];
export type HistoryKeyLoader = (index: number, previous: HistoryPage | null) => HistoryKey | null;
export type HistoryListItem = {
  key: string;
  title: string;
  watchedAt: number;
  video: VideoListItemInfo | null;
};
