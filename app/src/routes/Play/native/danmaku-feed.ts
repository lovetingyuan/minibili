import { DANMAKU_SEGMENT_SECONDS } from "@/api/danmaku";
import type { DanmakuItem } from "@/api/danmaku.types";

/** 本地使用从 0 开始的下标，请求层转换为接口的从 1 开始的编号。 */
export function resolveDanmakuSegmentWindow(currentTimeMs: number) {
  const currentIndex = Math.max(0, Math.floor(currentTimeMs / (DANMAKU_SEGMENT_SECONDS * 1000)));
  return { currentIndex, prefetchIndex: currentIndex + 1 };
}

/** 接口按权重等因素返回弹幕，单个分段内部也必须排序。 */
export function mergeDanmakuSegmentItems(existing: DanmakuItem[], incoming: DanmakuItem[]) {
  if (incoming.length === 0) {
    return existing;
  }
  return [...existing, ...incoming].sort((a, b) => a.progressMs - b.progressMs);
}
