import type { DanmakuItem } from "@/api/danmaku.types";

export type DanmakuFeedOptions = {
  cid: number;
  enabled: boolean;
  currentTimeMs: number;
  durationMs: number;
};

export type DanmakuFeedSnapshot = {
  items: DanmakuItem[];
};

export type DanmakuFeedState = {
  cid: number;
  segments: Map<number, DanmakuItem[]>;
  items: DanmakuItem[];
};
