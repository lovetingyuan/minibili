import React from "react";
import useSWR from "swr";

import { DANMAKU_SEGMENT_SECONDS, fetchDanmakuSegment } from "@/api/danmaku";
import type { DanmakuItem } from "@/api/danmaku.types";

import { mergeDanmakuSegmentItems, resolveDanmakuSegmentWindow } from "./danmaku-feed";
import type {
  DanmakuFeedOptions,
  DanmakuFeedSnapshot,
  DanmakuFeedState,
} from "./danmaku-feed.types";

const EMPTY_ITEMS: DanmakuItem[] = [];

function useDanmakuSegment(cid: number, index: number, enabled: boolean, durationMs: number) {
  const inRange =
    index >= 0 && (durationMs <= 0 || index * DANMAKU_SEGMENT_SECONDS * 1000 < durationMs);
  return useSWR(
    enabled && cid > 0 && inRange ? (["bilibili-danmaku-segment", cid, index] as const) : null,
    ([, segmentCid, segmentIndex]) => fetchDanmakuSegment(segmentCid, segmentIndex),
    {
      keepPreviousData: false,
      // 请求层复用已成功的分段；发送后失效的分段在重新挂载时重新拉取。
      revalidateIfStale: true,
      // 网络抖动后继续恢复当前窗口，不必等到 6 分钟后的下一次分段切换。
      shouldRetryOnError: true,
      onErrorRetry(_error, _key, _config, revalidate, options) {
        setTimeout(
          () => revalidate(options),
          Math.min(10000, 1000 * 2 ** Math.min(options.retryCount, 4)),
        );
      },
    },
  ).data;
}

/** 当前段、下一段，以及跨分段时仍可能有弹幕在屏幕上的上一段。 */
export function useDanmakuFeed(options: DanmakuFeedOptions): DanmakuFeedSnapshot {
  const { cid, enabled, currentTimeMs, durationMs } = options;
  const { currentIndex, prefetchIndex } = resolveDanmakuSegmentWindow(currentTimeMs);
  const previous = useDanmakuSegment(cid, currentIndex - 1, enabled, durationMs);
  const current = useDanmakuSegment(cid, currentIndex, enabled, durationMs);
  const next = useDanmakuSegment(cid, prefetchIndex, enabled, durationMs);
  const [state, setState] = React.useState<DanmakuFeedState>(() => ({
    cid,
    segments: new Map(),
    items: EMPTY_ITEMS,
  }));

  const incoming = [
    [currentIndex - 1, previous],
    [currentIndex, current],
    [prefetchIndex, next],
  ] as const;
  // 仅在 cid 或 SWR 数据引用变化时调整状态，避免先提交旧分P再由 effect 清空。
  if (
    state.cid !== cid ||
    incoming.some(([index, items]) => items && state.segments.get(index) !== items)
  ) {
    const segments = state.cid === cid ? new Map(state.segments) : new Map<number, DanmakuItem[]>();
    for (const [index, items] of incoming) {
      if (items) {
        segments.set(index, items);
      }
    }
    setState({
      cid,
      segments,
      items: mergeDanmakuSegmentItems(EMPTY_ITEMS, [...segments.values()].flat()),
    });
  }

  // 切换分P的第一帧就隔离旧数据；旧请求只会写入它自己的 SWR key。
  return { items: state.cid === cid ? state.items : EMPTY_ITEMS };
}
