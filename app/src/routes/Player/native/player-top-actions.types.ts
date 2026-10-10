import type {
  BackgroundPlayDurationMinutes,
  BackgroundPlaySelection,
} from "@/types/background-playback";
import type { PlaybackRate } from "./playback-rate";

export type PlayerTopActionsProps = {
  muted: boolean;
  playbackRate: PlaybackRate;
  playbackRateMenuOpen: boolean;
  loopEnabled: boolean;
  autoNextEnabled: boolean;
  showAutoNext: boolean;
  /**
   * 是否允许后台播放，开启时按钮高亮
   */
  backgroundPlayEnabled: boolean;
  backgroundPlayDurationMinutes: BackgroundPlayDurationMinutes;
  backgroundPlayMenuOpen: boolean;
  /**
   * 未登录 B站 时不展示发送弹幕按钮
   */
  canSendDanmaku: boolean;
  onTogglePlaybackRateMenu: () => void;
  onToggleMute: () => void;
  onClosePlaybackRateMenu: () => void;
  onPlaybackRateChange: (rate: PlaybackRate) => void;
  onToggleLoop: () => void;
  onToggleAutoNext: () => void;
  onToggleBackgroundPlayMenu: () => void;
  onCloseBackgroundPlayMenu: () => void;
  onBackgroundPlaySelect: (selection: BackgroundPlaySelection) => void;
  onSendDanmaku: () => void;
};
