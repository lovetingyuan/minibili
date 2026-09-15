import type { FavoriteAccount } from "./favorites.types";
import type { FavoriteVideo } from "./video-favorites.types";

export type DanmakuSendRequest = {
  video: FavoriteVideo;
  cid: number;
  text: string;
  /**
   * 弹幕出现时间（毫秒）
   */
  progressMs: number;
};

export type DanmakuSendResult = {
  dmid: string;
  text: string;
  progressMs: number;
};

export type DanmakuSendRequestDependencies = {
  readCookie: () => Promise<string | null>;
  isCurrentAccount: (account: FavoriteAccount) => boolean;
};

export type DanmakuSendKey = readonly ["bilibili-danmaku-send", string, number, string, number];
