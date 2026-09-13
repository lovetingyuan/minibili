import React from "react";

import {
  DANMAKU_SEGMENT_SECONDS,
  fetchDanmakuSegment,
  getDanmakuSegmentCount,
} from "@/api/danmaku";
import type { DanmakuItem } from "@/api/danmaku.types";

import { mergeDanmakuSegments } from "./danmaku-track";

type FeedState = {
  cid: number;
  segments: Map<number, DanmakuItem[]>;
  items: DanmakuItem[];
};

export type DanmakuFeedSnapshot = {
  items: DanmakuItem[];
  /**
   * 只在弹幕顺序被打乱（例如向后跳转后补拉分段）时自增，用于让渲染层重新定位
   */
  resetToken: number;
};

const SEGMENT_MS = DANMAKU_SEGMENT_SECONDS * 1000;

/**
 * 按需拉取弹幕分段：当前分段 + 下一分段，顺序加载时保持已有下标稳定
 */
export function useDanmakuFeed(options: {
  cid: number;
  durationSeconds: number;
  enabled: boolean;
  currentTimeMs: number;
}): DanmakuFeedSnapshot {
  const { cid, durationSeconds, enabled, currentTimeMs } = options;
  const stateRef = React.useRef<FeedState>({ cid, segments: new Map(), items: [] });
  const pendingRef = React.useRef(new Set<string>());
  const [snapshot, setSnapshot] = React.useState<DanmakuFeedSnapshot>({
    items: [],
    resetToken: 0,
  });

  const totalSegments = getDanmakuSegmentCount(durationSeconds);
  const segmentIndex = Math.max(
    0,
    Math.min(totalSegments - 1, Math.floor(currentTimeMs / SEGMENT_MS)),
  );
  const prefetchIndex = Math.min(totalSegments - 1, segmentIndex + 1);

  React.useEffect(() => {
    stateRef.current = { cid, segments: new Map(), items: [] };
    setSnapshot((current) => ({ items: [], resetToken: current.resetToken + 1 }));
  }, [cid]);

  React.useEffect(() => {
    if (!enabled || !cid) {
      return;
    }
    let canceled = false;
    const indexes = segmentIndex === prefetchIndex ? [segmentIndex] : [segmentIndex, prefetchIndex];

    indexes.forEach((index) => {
      const key = `${cid}-${index}`;
      if (stateRef.current.segments.has(index) || pendingRef.current.has(key)) {
        return;
      }
      pendingRef.current.add(key);
      void fetchDanmakuSegment(cid, index).then((items) => {
        pendingRef.current.delete(key);
        const state = stateRef.current;
        if (canceled || state.cid !== cid) {
          return;
        }
        state.segments.set(index, items);
        const merged = mergeDanmakuSegments(state.items, items);
        state.items = merged.items;
        setSnapshot((current) => ({
          items: merged.items,
          resetToken: merged.appended ? current.resetToken : current.resetToken + 1,
        }));
      });
    });

    return () => {
      canceled = true;
    };
  }, [cid, enabled, segmentIndex, prefetchIndex]);

  return snapshot;
}
