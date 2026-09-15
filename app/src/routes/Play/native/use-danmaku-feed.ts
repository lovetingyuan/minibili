import React from "react";

import type { DanmakuItem } from "@/api/danmaku.types";

import {
  createDanmakuFeedState,
  requestDanmakuSegment,
  resetDanmakuFeedState,
  resolveDanmakuSegmentWindow,
} from "./danmaku-feed";

export type DanmakuFeedSnapshot = {
  items: DanmakuItem[];
};

const EMPTY_ITEMS: DanmakuItem[] = [];

/**
 * 按需拉取弹幕分段：当前分段 + 下一分段。
 * 分段数据与播放进度无关，跳转只是切换加载窗口，不会重置已加载的数据
 */
export function useDanmakuFeed(options: {
  cid: number;
  enabled: boolean;
  currentTimeMs: number;
}): DanmakuFeedSnapshot {
  const { cid, enabled, currentTimeMs } = options;
  const stateRef = React.useRef(createDanmakuFeedState(cid));
  const activeRef = React.useRef(true);
  const [items, setItems] = React.useState<DanmakuItem[]>(EMPTY_ITEMS);

  React.useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  // 切换分P 后重新开始，旧 cid 的在飞请求会因为 cid 变化被丢弃
  React.useEffect(() => {
    if (stateRef.current.cid === cid) {
      return;
    }
    resetDanmakuFeedState(stateRef.current, cid);
    setItems(EMPTY_ITEMS);
  }, [cid]);

  const { currentIndex, prefetchIndex } = resolveDanmakuSegmentWindow(currentTimeMs);

  React.useEffect(() => {
    if (!enabled || !cid) {
      return;
    }
    const state = stateRef.current;
    if (state.cid !== cid) {
      return;
    }
    const notify = () => {
      if (!activeRef.current) {
        return;
      }
      setItems(state.items);
    };

    void requestDanmakuSegment(state, currentIndex, notify);
    if (prefetchIndex !== currentIndex) {
      void requestDanmakuSegment(state, prefetchIndex, notify);
    }
  }, [cid, enabled, currentIndex, prefetchIndex]);

  return { items };
}
