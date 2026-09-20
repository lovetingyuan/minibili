import type { VideoPlayer, VideoPlayerStatus } from "expo-video";
import type { AppStateStatus } from "react-native";

export type BackgroundPlaybackConfigurationResult = "applied" | "deferred" | "failed";

export type PlayerSnapshot = {
  currentTimeMs: number;
  isPlaying: boolean;
  status: VideoPlayerStatus;
};

export type PlayerSynchronization = PlayerSnapshot & {
  danmakuAnchorMs: number | null;
};

type BackgroundPlaybackPlayer = Pick<
  VideoPlayer,
  "showNowPlayingNotification" | "staysActiveInBackground"
>;

type PlayerSnapshotSource = Pick<VideoPlayer, "currentTime" | "playing" | "status">;

/**
 * Android 12+ 不允许应用在后台启动播放 service。
 * false 可以安全写入，但为了让行为一致，所有后台播放配置都统一等到前台执行。
 */
export function configureBackgroundPlayback(
  player: BackgroundPlaybackPlayer,
  enabled: boolean,
  showNotification: boolean,
  appState: AppStateStatus,
): BackgroundPlaybackConfigurationResult {
  if (appState !== "active") {
    return "deferred";
  }
  try {
    player.staysActiveInBackground = enabled;
    // 部分 Android ROM 会缓存媒体会话最初的 idle 状态，导致通知一直没有按钮和时长。
    // 后台 service 可以提前准备，但通知要等播放器真正开始过以后再显示。
    player.showNowPlayingNotification = enabled && showNotification;
    return "applied";
  } catch {
    // HostFunction 可能在系统刚判定 App 进入后台时抛错；尽量收敛到安全状态。
    try {
      player.staysActiveInBackground = false;
      player.showNowPlayingNotification = false;
    } catch {
      // 原生状态已经不可写时保持静默，下一次回到前台会重新配置。
    }
    return "failed";
  }
}

export function readPlayerSnapshot(player: PlayerSnapshotSource): PlayerSnapshot {
  const currentTimeMs = Math.max(0, Math.round(player.currentTime * 1000) || 0);
  return {
    currentTimeMs,
    isPlaying: player.playing,
    status: player.status,
  };
}

export function resolvePlayerSynchronization(
  player: PlayerSnapshotSource,
  resetDanmaku: boolean,
): PlayerSynchronization {
  const snapshot = readPlayerSnapshot(player);
  return {
    ...snapshot,
    danmakuAnchorMs: resetDanmaku ? snapshot.currentTimeMs : null,
  };
}
