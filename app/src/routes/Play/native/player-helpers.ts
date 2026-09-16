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
 * 竖屏视频内联播放时占屏幕高度的比例
 */
export const PLAYER_PORTRAIT_HEIGHT_RATIO = 0.33;

/**
 * 竖屏视频下滑展开后占屏幕高度的比例
 */
export const PLAYER_PORTRAIT_EXPANDED_HEIGHT_RATIO = 0.7;

/**
 * 播放中控件无操作后自动隐藏的时间
 */
export const PLAYER_CONTROLS_AUTO_HIDE_MS = 3000;

/**
 * 暂停持续多久才认为需要展示暂停态的 UI（中间的续播按钮、控制条上的播放图标）。
 * 起播、seek、缓冲都会让 playing 短暂变成 false，
 * 立即展示会让这些控件在视频刚开始播放时闪一下
 */
export const PLAYER_PAUSED_UI_DELAY_MS = 300;

/**
 * 播放器高度切换的过渡时长
 */
export const PLAYER_HEIGHT_ANIMATION_MS = 200;

/**
 * 竖向滑动切换播放器高度所需的最小滑动距离
 */
export const PLAYER_SWIPE_MIN_DISTANCE = 60;

/**
 * 竖向滑动的手势激活距离（超过即认为是滑动而不是点击）
 */
export const PLAYER_SWIPE_ACTIVE_OFFSET_Y = 12;

/**
 * 竖向滑动时允许的横向偏移，超过则判定为横向手势
 */
export const PLAYER_SWIPE_FAIL_OFFSET_X = 24;

/**
 * 一次左右滑动调整的播放进度（秒）
 */
export const PLAYER_SEEK_STEP_SECONDS = 10;

/**
 * 左右滑动调整进度所需的最小滑动距离
 */
export const PLAYER_SEEK_SWIPE_MIN_DISTANCE = 40;

/**
 * 左右滑动的手势激活距离（超过即认为是滑动而不是点击）
 */
export const PLAYER_SEEK_SWIPE_ACTIVE_OFFSET_X = 12;

/**
 * 左右滑动时允许的纵向偏移，超过则判定为竖向手势
 */
export const PLAYER_SEEK_SWIPE_FAIL_OFFSET_Y = 24;

/**
 * 左右滑动结束后进度提示浮层的停留时间
 */
export const PLAYER_SEEK_HINT_HOLD_MS = 400;

/**
 * 判定播放进度是否停在结尾的容差（播放结束后的进度就等于总时长）
 */
export const PLAYER_REPLAY_END_TOLERANCE_MS = 300;

/**
 * 竖向滑动的方向，与网页播放器 change-video-height 的取值保持一致
 */
export type PlayerSwipeDirection = "down" | "up";

/**
 * 媒体请求的 source：pc 平台的播放地址必须带 Referer，且 UA 不能包含 "android"，
 * 否则 CDN 直接返回 403（详见 constants 里的 mediaUA）。
 *
 * 后台播放时系统媒体通知/锁屏展示的标题取自 metadata，标题必须由调用方传入
 * 渲染期稳定的值（如路由参数里的标题）：`useVideoPlayer` 会用 JSON 字符串比较
 * source，标题异步补齐会触发播放器重建，导致播放进度归零。
 */
export function createVideoSource(uri: string, title?: string): VideoSourceObject {
  return {
    uri,
    headers: {
      Referer: PLAY_URL_REFERER,
      "User-Agent": mediaUA,
    },
    ...(title ? { metadata: { title } } : {}),
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
 * 中间续播按钮的显示条件：开始播放、首帧已经渲染出来，且当前稳定处于暂停态。
 *
 * 首帧渲染事件可能比 playingChange 先到，播放真正开始过（playbackStarted）之前不展示；
 * paused 由 usePlayerPausedUi 计算，已经过滤掉起播、seek、缓冲带来的短暂暂停，
 * 避免按钮在视频刚开始播放时闪一下。
 * 错误态、滑动进度提示、弹幕输入条这些浮层会盖住画面，此时也不展示。
 */
export function shouldShowResumeButton(options: {
  started: boolean;
  firstFrameRendered: boolean;
  playbackStarted: boolean;
  paused: boolean;
  hasError: boolean;
  overlayVisible: boolean;
}) {
  const { started, firstFrameRendered, playbackStarted, paused, hasError, overlayVisible } =
    options;
  return started && firstFrameRendered && playbackStarted && paused && !hasError && !overlayVisible;
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
 * 下滑展开后占屏幕高度的 70%，
 * 横屏视频按宽高比铺满宽度并上下各留出一点黑边
 */
export function resolveInlinePlayerHeight(options: {
  screenWidth: number;
  screenHeight: number;
  videoWidth?: number;
  videoHeight?: number;
  expanded?: boolean;
}) {
  const { screenWidth, screenHeight, videoWidth, videoHeight, expanded = false } = options;
  if (!videoWidth || !videoHeight) {
    return Math.round(screenWidth * 0.6);
  }
  if (videoHeight > videoWidth) {
    const ratio = expanded ? PLAYER_PORTRAIT_EXPANDED_HEIGHT_RATIO : PLAYER_PORTRAIT_HEIGHT_RATIO;
    return Math.round(screenHeight * ratio);
  }
  return (
    Math.round((videoHeight / videoWidth) * screenWidth) + PLAYER_LANDSCAPE_VERTICAL_PADDING * 2
  );
}

/**
 * 竖向滑动的方向：下滑展开、上滑收起。
 * 滑动距离不足或者横向位移更大（更接近横向手势）时忽略
 */
export function resolveVerticalSwipe(options: {
  translationX: number;
  translationY: number;
  minDistance?: number;
}): PlayerSwipeDirection | null {
  const { translationX, translationY, minDistance = PLAYER_SWIPE_MIN_DISTANCE } = options;
  if (Math.abs(translationY) <= Math.abs(translationX)) {
    return null;
  }
  if (translationY > minDistance) {
    return "down";
  }
  if (translationY < -minDistance) {
    return "up";
  }
  return null;
}

/**
 * 左右滑动需要调整的播放进度：右滑快进、左滑后退，单位秒。
 * 滑动距离不足或者纵向位移更大（更接近竖向手势）时返回 0
 */
export function resolveSeekSwipeSeconds(options: {
  translationX: number;
  translationY: number;
  minDistance?: number;
  stepSeconds?: number;
}): number {
  const {
    translationX,
    translationY,
    minDistance = PLAYER_SEEK_SWIPE_MIN_DISTANCE,
    stepSeconds = PLAYER_SEEK_STEP_SECONDS,
  } = options;
  if (Math.abs(translationX) <= Math.abs(translationY)) {
    return 0;
  }
  if (translationX >= minDistance) {
    return stepSeconds;
  }
  if (translationX <= -minDistance) {
    return -stepSeconds;
  }
  return 0;
}

/**
 * 左右滑动后的目标播放进度：起点两侧都夹在可播放区间内，
 * 总时长未知（<= 0）时只保证不越过头
 */
export function resolveSeekTargetMs(options: {
  currentMs: number;
  deltaMs: number;
  durationMs: number;
}): number {
  const { currentMs, deltaMs, durationMs } = options;
  const targetMs = Math.max(0, Math.round(currentMs + deltaMs));
  if (durationMs <= 0) {
    return targetMs;
  }
  return Math.min(durationMs, targetMs);
}

/**
 * 再次点击播放时是否需要从头开始：
 * expo-video 在播放到结尾后调用 play() 不会有任何反应，
 * 需要先回到开头再播放，因此进度停在结尾（容差内）时判定为重新播放。
 * 总时长未知时无法判断，按普通续播处理
 */
export function shouldRestartPlayback(options: {
  currentMs: number;
  durationMs: number;
  toleranceMs?: number;
}): boolean {
  const { currentMs, durationMs, toleranceMs = PLAYER_REPLAY_END_TOLERANCE_MS } = options;
  if (durationMs <= 0) {
    return false;
  }
  return currentMs >= durationMs - toleranceMs;
}
