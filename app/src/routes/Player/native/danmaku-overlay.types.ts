import type { DanmakuItem } from "@/api/danmaku.types";
import type { DanmakuRenderItem } from "./danmaku-track.types";

export type DanmakuOverlayProps = {
  cid: number;
  enabled: boolean;
  isPlaying: boolean;
  currentTimeMs: number;
  durationMs: number;
  /** 跳转、续播、开关弹幕后重建动画，按媒体时间重新定位。 */
  anchorTimeMs: number;
  playbackRate: number;
  width: number;
  height: number;
  fontSize?: number;
  localItems?: DanmakuItem[];
};

export type DanmakuItemViewProps = {
  item: DanmakuRenderItem;
  isPlaying: boolean;
  playbackRate: number;
};
