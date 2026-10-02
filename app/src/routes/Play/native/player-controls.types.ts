import type {
  BackgroundPlayDurationMinutes,
  BackgroundPlaySelection,
} from "@/types/background-playback";
import type { PlaybackRate } from "./playback-rate";

export type PlayerControlsMenu = "playback-rate" | "background-play" | null;

export type PlayerControlsProps = {
  /**
   * 是否稳定处于暂停态（缓冲、seek 造成的短暂暂停不算，见 usePlayerPausedUi）
   */
  paused: boolean;
  /**
   * 播放是否已经结束（不会自动继续播放）。结束时进度对齐总时长，
   * 避免最后一次 timeUpdate 停在总时长前一秒造成 03:31/03:32 的显示
   */
  ended: boolean;
  currentTimeMs: number;
  durationMs: number;
  playbackRate: PlaybackRate;
  danmakuEnabled: boolean;
  /**
   * 未登录 B站 时不展示发送弹幕按钮
   */
  canSendDanmaku: boolean;
  /**
   * 退到后台（含息屏）后是否继续播放
   */
  backgroundPlayEnabled: boolean;
  backgroundPlayDurationMinutes: BackgroundPlayDurationMinutes;
  loopEnabled: boolean;
  autoNextEnabled: boolean;
  showAutoNext: boolean;
  fullscreen: boolean;
  visible: boolean;
  onTogglePlay: () => void;
  onPlaybackRateChange: (rate: PlaybackRate) => void;
  onToggleDanmaku: () => void;
  onSendDanmaku: () => void;
  onBackgroundPlaySelect: (selection: BackgroundPlaySelection) => void;
  onToggleLoop: () => void;
  onToggleAutoNext: () => void;
  onToggleFullscreen: () => void;
  onSeek: (timeMs: number) => void;
  /**
   * 任意控件操作时调用，用于重置自动隐藏计时
   */
  onInteraction: () => void;
};
