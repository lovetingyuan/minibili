import type { VideoSourceObject } from "expo-video";

import type { VideoQuality } from "@/api/play-url";
// 使用相对路径，保证 vitest 下无需别名配置即可解析
import { mediaUA } from "../../../constants";

/**
 * 长按加速的倍速
 */
export const PLAYER_FAST_RATE = 3;

/**
 * 视频 CDN 防盗链要求的 Referer
 */
export const PLAY_URL_REFERER = "https://www.bilibili.com";

/**
 * 播放地址自动刷新的次数上限，超过后展示错误态交给用户重试
 */
export const PLAY_URL_MAX_REFRESH = 2;

/**
 * 播放时间跳变超过该毫秒数时认为是 seek
 */
const PLAYER_SEEK_TOLERANCE_MS = 1500;

/**
 * 横向视频内联播放时上下各留出的黑边高度
 */
export const PLAYER_LANDSCAPE_VERTICAL_PADDING = 12;

/**
 * 播放中控件无操作后自动隐藏的时间
 */
export const PLAYER_CONTROLS_AUTO_HIDE_MS = 3000;

/**
 * 媒体请求的 source：pc 平台的播放地址必须带 Referer，且 UA 不能包含 "android"，
 * 否则 CDN 直接返回 403（详见 constants 里的 mediaUA）。
 */
export function createVideoSource(uri: string): VideoSourceObject {
  return {
    uri,
    headers: {
      Referer: PLAY_URL_REFERER,
      "User-Agent": mediaUA,
    },
  };
}

export type PlaybackFailover =
  | { type: "next-url"; index: number }
  | { type: "refresh"; index: number; refreshCount: number }
  | { type: "give-up" };

/**
 * 播放失败后的兜底策略：先用备用 CDN 镜像，镜像用尽后重新获取播放地址，
 * 刷新次数超过上限才放弃。
 */
export function resolvePlaybackFailover(options: {
  index: number;
  total: number;
  refreshCount: number;
  maxRefresh?: number;
}): PlaybackFailover {
  const { index, total, refreshCount, maxRefresh = PLAY_URL_MAX_REFRESH } = options;
  if (index + 1 < total) {
    return { type: "next-url", index: index + 1 };
  }
  if (refreshCount < maxRefresh) {
    return { type: "refresh", index: 0, refreshCount: refreshCount + 1 };
  }
  return { type: "give-up" };
}

/**
 * 控件自动隐藏延时：播放中 3 秒后隐藏，暂停时不自动隐藏
 */
export function resolveControlsAutoHideMs(isPlaying: boolean): number | null {
  return isPlaying ? PLAYER_CONTROLS_AUTO_HIDE_MS : null;
}

/**
 * 点击视频切换控件显隐
 */
export function toggleControlsVisible(visible: boolean) {
  return !visible;
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
 * 内联播放器高度：竖屏视频固定占屏幕高度的一部分，
 * 横屏视频按宽高比铺满宽度并上下各留出一点黑边
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
  return (
    Math.round((videoHeight / videoWidth) * screenWidth) + PLAYER_LANDSCAPE_VERTICAL_PADDING * 2
  );
}
