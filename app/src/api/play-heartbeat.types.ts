import type { BilibiliAccount } from "../features/bilibili-session/types";
import type { VideoQuality } from "./play-url";

/** 上报账号：与其它写接口一致，用 mid + 会话代次判断请求是否仍然有效 */
export type PlayHeartbeatAccount = Pick<BilibiliAccount, "mid" | "generation">;

/**
 * 一次播放会话：同一分P 的清晰度切换沿用同一个会话，
 * 换视频/换分P/重新播放时重建。
 */
export type PlayHeartbeatSession = {
  /** 串联同一次播放的 32 位十六进制 id */
  session: string;
  /** 开始播放的秒级时间戳，心跳用它作为 start_ts */
  startTs: number;
  /** 会话内到达过的最大播放位置（秒） */
  maxPlayedTime: number;
};

/** 1 开始播放 / 0 定时上报 / 2 暂停 / 3 继续播放 / 4 播放结束 */
export type PlayHeartbeatType = 0 | 1 | 2 | 3 | 4;

export type PlayHeartbeatReport = {
  type: PlayHeartbeatType;
  /** 当前播放位置（秒）；播放结束时为 -1，B站按“已看完”处理 */
  playedTime: number;
  /** 会话内累计真实播放秒数，拖动进度条不会增加 */
  realPlayedTime: number;
  videoDuration: number;
  quality: VideoQuality;
};

export type PlayHeartbeatVideo = {
  aid: string;
  bvid: string;
  cid: number;
  page: number;
};

/** wbi 签名用的 img/sub key，取自 nav 接口 */
type PlayHeartbeatWbiKeys = { img_url: string; sub_url: string };

export type PlayHeartbeatRequestDependencies = {
  readCookie: () => Promise<string | null>;
  isCurrentAccount: (account: PlayHeartbeatAccount) => boolean;
  getWbiKeys: () => Promise<PlayHeartbeatWbiKeys>;
};
