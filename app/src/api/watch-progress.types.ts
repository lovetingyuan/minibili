import type { BilibiliAccount } from "../features/bilibili-session/types";
import type { WatchProgressSnapshot } from "../utils/watch-progress";

/** bvid → 接口返回的观看进度快照 */
export type WatchProgressMap = Record<string, WatchProgressSnapshot>;
export type WatchProgressAccount = Pick<BilibiliAccount, "mid" | "generation">;
export type WatchProgressRequest = (url: string) => Promise<unknown>;
