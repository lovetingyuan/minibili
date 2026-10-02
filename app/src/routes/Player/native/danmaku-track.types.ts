import type { DanmakuItem } from "@/api/danmaku.types";

export type DanmakuRenderItem = {
  key: string;
  content: string;
  color: string;
  fontSize: number;
  mode: DanmakuItem["mode"];
  lane: number;
  top: number;
  textWidth: number;
  progressMs: number;
  durationMs: number;
  elapsedMs: number;
  currentX: number;
  endX: number;
};

export type DanmakuLayoutOptions = {
  containerWidth: number;
  containerHeight: number;
  fontSize?: number;
  laneHeight?: number;
};

export type DanmakuLayout = {
  /** -1 表示轨道满时按碰撞规则过滤。 */
  lanes: Int16Array;
  containerWidth: number;
  containerHeight: number;
  laneHeight: number;
  laneCount: number;
  fontSize: number;
  maxDurationMs: number;
};

export type DanmakuVisibleQuery = {
  currentTimeMs: number;
};

export type DanmakuAnimation = {
  startX: number;
  endX: number;
  durationMs: number;
};

export type DanmakuLaneOccupant = {
  progressMs: number;
  textWidth: number;
  durationMs: number;
};
