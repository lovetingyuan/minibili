import type { VideoSourceObject } from "expo-video";

import type { VideoQuality } from "@/api/play-url";
// 使用相对路径，保证 vitest 下无需别名配置即可解析
import { mediaUA } from "../../../constants";
import type { NetworkUsage } from "../../../utils/network";

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
 * 初始续播只允许发生在播放器仍停留在起点附近时。
 * 即使 playingChange 丢失，进度已经向前推进后也不能再被迟到的续播数据拉回去。
 */
export const PLAYER_INITIAL_RESUME_MAX_CURRENT_MS = 1000;

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

export type InitialResumeSnapshot = {
  key: string;
  positionMs: number | null;
};

export type InitialResumeDecision = "wait" | "apply" | "consume";

export type PlayerResumeDecision =
  | { type: "wait" | "consume" }
  | { type: "apply"; origin: "initial" | "failover"; positionMs: number };

/**
 * 每个分 P 只截取进入时的本地续播位置；播放中的定时落盘不能改变这份快照。
 */
export function resolveInitialResumeSnapshot(
  current: InitialResumeSnapshot,
  key: string,
  positionMs: number | null,
): InitialResumeSnapshot {
  if (current.key === key) {
    return current;
  }
  return { key, positionMs };
}

/**
 * 初始续播的唯一入口：播放器就绪且尚未真正播放时才允许跳转。
 * `consume` 表示续播窗口已经结束，此后同一分 P 的迟到数据都必须忽略。
 */
export function resolveInitialResumeDecision(options: {
  handled: boolean;
  positionMs: number;
  currentTimeMs: number;
  ready: boolean;
  hasPlayed: boolean;
  maxCurrentTimeMs?: number;
}): InitialResumeDecision {
  const {
    handled,
    positionMs,
    currentTimeMs,
    ready,
    hasPlayed,
    maxCurrentTimeMs = PLAYER_INITIAL_RESUME_MAX_CURRENT_MS,
  } = options;
  if (handled) {
    return "consume";
  }
  if (hasPlayed || currentTimeMs > maxCurrentTimeMs) {
    return "consume";
  }
  if (positionMs <= 0 || !ready) {
    return "wait";
  }
  return "apply";
}

/**
 * CDN 换源恢复独立于初始续播，并在新播放器 ready 时拥有更高优先级。
 */
export function resolvePlayerResumeDecision(
  options: Parameters<typeof resolveInitialResumeDecision>[0] & {
    failoverPositionMs: number;
  },
): PlayerResumeDecision {
  if (options.ready && options.failoverPositionMs > 0) {
    return {
      type: "apply",
      origin: "failover",
      positionMs: options.failoverPositionMs,
    };
  }
  const initialDecision = resolveInitialResumeDecision(options);
  if (initialDecision !== "apply") {
    return { type: initialDecision };
  }
  return {
    type: "apply",
    origin: "initial",
    positionMs: options.positionMs,
  };
}

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
    metadata: {
      ...(title ? { title } : {}),
      artist: "MiniBili",
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
 * 中间续播按钮的显示条件：开始播放、画面已经可见，且当前稳定处于暂停态。
 *
 * 画面可见指首帧已经渲染（封面已撤掉），或者播放结束后重新展示了封面；
 * 首帧渲染事件可能比 playingChange 先到，播放真正开始过（playbackStarted）之前不展示；
 * paused 由 usePlayerPausedUi 计算，已经过滤掉起播、seek、缓冲带来的短暂暂停，
 * 避免按钮在视频刚开始播放时闪一下。
 * 错误态、滑动进度提示、弹幕输入条这些浮层会盖住画面，此时也不展示。
 */
export function shouldShowResumeButton(options: {
  started: boolean;
  videoVisible: boolean;
  playbackStarted: boolean;
  paused: boolean;
  hasError: boolean;
  overlayVisible: boolean;
}) {
  const { started, videoVisible, playbackStarted, paused, hasError, overlayVisible } = options;
  return started && videoVisible && playbackStarted && paused && !hasError && !overlayVisible;
}

/**
 * 控制条上展示的播放进度：拖动中跟随拖动位置；
 * 播放结束后对齐总时长——最后一次 timeUpdate 通常停在总时长前面不到一秒
 * （例如 03:31.8/03:32），直接展示会得到比总时长少一秒的读数
 */
export function resolvePlaybackDisplayMs(options: {
  currentMs: number;
  durationMs: number;
  ended: boolean;
  scrubMs?: number | null;
}) {
  const { currentMs, durationMs, ended, scrubMs } = options;
  if (typeof scrubMs === "number") {
    return scrubMs;
  }
  return ended ? durationMs : currentMs;
}

/**
 * 点击视频切换控件显隐
 */
export function toggleControlsVisible(visible: boolean) {
  return !visible;
}

/**
 * 默认清晰度：只有确认在 WiFi 下才用 1080P；流量、断网与状态未知都先用 720P，
 * 用户在流量下手动打开高清开关后才用 1080P
 */
export function resolvePreferredQuality(
  networkUsage: NetworkUsage,
  highQuality: boolean,
): VideoQuality {
  if (networkUsage !== "wifi" && !highQuality) {
    return 64;
  }
  return 80;
}

/**
 * 只有确认在 WiFi 下、且已经拿到播放地址时才自动开播；
 * 流量、断网与网络状态未知都交给用户点击封面
 */
export function shouldAutoStartPlayback(networkUsage: NetworkUsage, hasSource: boolean) {
  return networkUsage === "wifi" && hasSource;
}

/**
 * 是否把播放地址交给播放器：source 非空会让原生播放器构造后立刻加载视频流，
 * 所以只有确认在 WiFi 下才提前加载；流量、断网与网络状态未知都必须等用户
 * 主动点击封面，避免在用户不知情时消耗移动流量。
 *
 * WiFi 下尚未开播也返回 true，保持"进页面即预加载"的既有行为，
 * 不会因为先挂地址再开播而多重建一次播放器。
 */
export function shouldLoadVideoStream(options: {
  networkUsage: NetworkUsage;
  started: boolean;
}) {
  return options.started || options.networkUsage === "wifi";
}

/**
 * 从免费网络切到流量时暂停播放，避免用户不知情地继续消耗流量。
 * 其余网络变化都不打断播放：换清晰度会重建播放器，视频会从头开始
 */
export function shouldPausePlaybackOnNetworkChange(
  previousUsage: NetworkUsage,
  usage: NetworkUsage,
) {
  return previousUsage !== "metered" && usage === "metered";
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
