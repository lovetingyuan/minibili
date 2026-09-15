import { DANMAKU_SEGMENT_SECONDS, fetchDanmakuSegment } from "@/api/danmaku";
import type { DanmakuItem } from "@/api/danmaku.types";

/**
 * 预取的分段数量：当前分段之后再多拉一段
 */
const DANMAKU_PREFETCH_SEGMENTS = 1;

/**
 * 分段请求失败后的重试间隔（毫秒），用完就先放弃这一段，
 * 等加载窗口再次变化时重试，避免一次网络抖动就让整段没有弹幕
 */
export const DANMAKU_SEGMENT_RETRY_DELAYS_MS = [800, 2000];

const SEGMENT_MS = DANMAKU_SEGMENT_SECONDS * 1000;

export type DanmakuFeedState = {
  cid: number;
  /**
   * 已经拿到数据的分段
   */
  segments: Map<number, DanmakuItem[]>;
  /**
   * 正在请求中的分段
   */
  pending: Set<number>;
  /**
   * 已加载的全部弹幕，按 progressMs 升序
   */
  items: DanmakuItem[];
};

export function createDanmakuFeedState(cid: number): DanmakuFeedState {
  return { cid, segments: new Map(), pending: new Set(), items: [] };
}

/**
 * 原地重置为另一个分P 的数据。已经发出去、还没回来的请求会因为 cid 变了而被丢弃
 */
export function resetDanmakuFeedState(state: DanmakuFeedState, cid: number) {
  state.cid = cid;
  state.segments.clear();
  state.pending.clear();
  state.items = [];
}

/**
 * 播放进度所在的分段与需要预取的分段
 */
export function resolveDanmakuSegmentWindow(currentTimeMs: number) {
  const currentIndex = Math.max(0, Math.floor(currentTimeMs / SEGMENT_MS));
  return { currentIndex, prefetchIndex: currentIndex + DANMAKU_PREFETCH_SEGMENTS };
}

function sortDanmakuItems(items: DanmakuItem[]) {
  return [...items].sort((a, b) => a.progressMs - b.progressMs);
}

/**
 * 合并一个新分段：顺序到达时保持已有下标稳定，乱序到达时重新排序
 */
export function mergeDanmakuSegmentItems(existing: DanmakuItem[], incoming: DanmakuItem[]) {
  if (incoming.length === 0) {
    return existing;
  }
  if (existing.length === 0) {
    return sortDanmakuItems(incoming);
  }
  const last = existing[existing.length - 1];
  if (incoming[0].progressMs >= last.progressMs) {
    return [...existing, ...incoming];
  }
  return sortDanmakuItems([...existing, ...incoming]);
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * 按需请求一个分段，结果按 cid 归属写入状态。
 * 结果不绑定调用方的生命周期：外层 effect 重跑（跳转、开关弹幕）时，
 * 已经在飞的请求照样会落到 items 上，不会像以前那样被丢弃后永久缺失
 */
export async function requestDanmakuSegment(
  state: DanmakuFeedState,
  index: number,
  notify: () => void,
) {
  if (state.segments.has(index) || state.pending.has(index)) {
    return;
  }
  state.pending.add(index);
  const { cid } = state;

  for (let retryIndex = 0; ; retryIndex += 1) {
    try {
      const items = await fetchDanmakuSegment(cid, index);
      if (state.cid !== cid) {
        return;
      }
      state.pending.delete(index);
      state.segments.set(index, items);
      state.items = mergeDanmakuSegmentItems(state.items, items);
      notify();
      return;
    } catch {
      if (state.cid !== cid) {
        return;
      }
      const retryDelay = DANMAKU_SEGMENT_RETRY_DELAYS_MS[retryIndex];
      if (retryDelay === undefined) {
        state.pending.delete(index);
        return;
      }
      await delay(retryDelay);
    }
  }
}
