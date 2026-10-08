import type {
  PlayHeartbeatAccount,
  PlayHeartbeatSession,
  PlayHeartbeatVideo,
} from "@/api/play-heartbeat.types";
import type { VideoQuality } from "@/api/play-url";

export type PlayHeartbeatReporterProps = {
  bvid: string;
  aid?: string | number;
  cid: number;
  page: number;
  /** 当前分P 时长（秒），拿不到时不上报 */
  durationSeconds: number;
  quality: VideoQuality;
  isFocused: boolean;
  isPlaying: boolean;
  currentTimeMs: number;
};

export type PlayHeartbeatEndTarget = Pick<PlayHeartbeatReporterProps, "bvid" | "cid">;

export type PlayHeartbeatLeaveTarget = PlayHeartbeatEndTarget & {
  currentTimeMs: number;
};

export type PlayHeartbeatInput = {
  account: PlayHeartbeatAccount | null;
  props: PlayHeartbeatReporterProps;
};

/** 一次播放会话的完整状态；全部放在 ref 里，状态机按真实状态变化上报 */
export type PlayHeartbeatState = {
  /** 会话对应的 `bvid:cid`，变化时重建 */
  key: string;
  session: PlayHeartbeatSession | null;
  /** 会话的报送信息快照，切换分P 后仍能按旧分P 收尾 */
  video: PlayHeartbeatVideo | null;
  quality: VideoQuality;
  durationSeconds: number;
  positionSeconds: number;
  playing: boolean;
  /** 本段开始播放的时间戳（毫秒），未播放时为 0 */
  playingSinceMs: number;
  /** 会话内累计播放时长（毫秒） */
  accumulatedMs: number;
};

export type PlayHeartbeatCompletedSession = {
  state: PlayHeartbeatState;
  account: PlayHeartbeatAccount | null;
};

export type PlayHeartbeatTickTimer = ReturnType<typeof setTimeout> | null;
