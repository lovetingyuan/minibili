import type { VideoQuality } from "@/api/play-url";

/**
 * 长按加速的倍速
 */
export const PLAYER_FAST_RATE = 3;

/**
 * 播放时间跳变超过该毫秒数时认为是 seek
 */
const PLAYER_SEEK_TOLERANCE_MS = 1500;

export type PlayerTapAction = "play" | "none";

/**
 * 单击：暂停时继续播放，播放中不做处理（暂停用双击）
 */
export function resolveTapAction(isPlaying: boolean): PlayerTapAction {
  return isPlaying ? "none" : "play";
}

/**
 * 流量环境下未勾选高清用 720P，其余情况用 1080P
 */
export function resolvePreferredQuality(isCellular: boolean, highQuality: boolean): VideoQuality {
  if (isCellular && !highQuality) {
    return 64;
  }
  return 80;
}

export function isSeekJump(
  previousMs: number,
  currentMs: number,
  toleranceMs = PLAYER_SEEK_TOLERANCE_MS,
) {
  return Math.abs(currentMs - previousMs) > toleranceMs;
}

export function formatPlaybackTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00";
  }
  const total = Math.floor(seconds);
  const hour = Math.floor(total / 3600);
  const minute = Math.floor((total % 3600) / 60);
  const second = total % 60;
  const pad = (value: number) => `${value}`.padStart(2, "0");

  if (hour > 0) {
    return `${hour}:${pad(minute)}:${pad(second)}`;
  }
  return `${pad(minute)}:${pad(second)}`;
}

/**
 * 内联播放器高度：竖屏视频固定占屏幕高度的一部分，横屏视频按宽高比铺满宽度
 */
export function resolveInlinePlayerHeight(options: {
  screenWidth: number;
  screenHeight: number;
  videoWidth?: number;
  videoHeight?: number;
}) {
  const { screenWidth, screenHeight, videoWidth, videoHeight } = options;
  if (!videoWidth || !videoHeight) {
    return Math.round(screenWidth * 0.6);
  }
  if (videoHeight > videoWidth) {
    return Math.round(screenHeight * 0.33);
  }
  return Math.round((videoHeight / videoWidth) * screenWidth);
}
