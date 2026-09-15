import type { DanmakuItem } from "@/api/danmaku.types";

export const DANMAKU_DEFAULT_FONTSIZE = 16;
const DANMAKU_DEFAULT_CROSS_SECONDS = 8;

export type DanmakuRenderItem = {
  key: string;
  content: string;
  color: string;
  fontSize: number;
  lane: number;
  top: number;
  /**
   * 估算的文本宽度，用于计算位移与轨道占用
   */
  textWidth: number;
  /**
   * 起始位置（容器宽度，即整个弹幕在右侧屏幕外）
   */
  startX: number;
  /**
   * 从右侧进入到完全离开左侧的总位移
   */
  travel: number;
  /**
   * 开始移动时的播放时间（毫秒）
   */
  startMs: number;
  durationMs: number;
};

export type DanmakuTrackOptions = {
  currentTimeMs: number;
  containerWidth: number;
  containerHeight: number;
  fontSize?: number;
  laneHeight?: number;
  /**
   * 一条弹幕横穿一屏宽度所需秒数
   */
  crossSeconds?: number;
};

export type DanmakuTrackResult = {
  items: DanmakuRenderItem[];
  /**
   * 每条轨道可以放下一条弹幕的播放时间（毫秒）
   */
  lanes: number[];
  nextIndex: number;
};

function isWideChar(code: number) {
  return code >= 0x2e80;
}

/**
 * 估算弹幕文本宽度，不需要精确测量，只用于位移与轨道占用计算
 */
export function estimateDanmakuWidth(content: string, fontSize: number) {
  let width = 0;
  for (const char of content) {
    const code = char.codePointAt(0) ?? 0;
    if (isWideChar(code)) {
      width += fontSize;
    } else {
      width += fontSize * 0.55;
    }
  }
  return Math.ceil(width);
}

export function toDanmakuColor(color: number) {
  const value = Math.max(0, Math.min(0xffffff, Math.floor(color)));
  return `#${value.toString(16).padStart(6, "0")}`;
}

export function resolveDanmakuLaneCount(containerHeight: number, laneHeight: number) {
  return Math.max(1, Math.floor(containerHeight / laneHeight));
}

/**
 * 找出从 currentTimeMs 开始还需要展示的弹幕下标（跳转后重新定位用）
 */
export function findDanmakuStartIndex(items: DanmakuItem[], currentTimeMs: number) {
  let low = 0;
  let high = items.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (items[middle].progressMs < currentTimeMs) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  return low;
}

export type DueLocalDanmaku = {
  /**
   * 已经到达播放时间、还没有展示过的本地弹幕
   */
  items: DanmakuItem[];
  /**
   * 下一次消费的起始下标
   */
  nextIndex: number;
};

/**
 * 取出本地回显弹幕里已经到播放时间、还没有展示过的部分。
 * items 按 progressMs 升序排列，startIndex 指向下一条待消费的弹幕。
 */
export function selectDueLocalDanmaku(
  items: DanmakuItem[],
  currentTimeMs: number,
  startIndex: number,
): DueLocalDanmaku {
  let index = Math.max(0, Math.min(startIndex, items.length));
  const due: DanmakuItem[] = [];

  while (index < items.length && items[index].progressMs <= currentTimeMs) {
    due.push(items[index]);
    index += 1;
  }

  return { items: due, nextIndex: index };
}

function sortDanmakuItems(items: DanmakuItem[]) {
  return [...items].sort((a, b) => a.progressMs - b.progressMs);
}

export type DanmakuMergeResult = {
  items: DanmakuItem[];
  /**
   * 新分段是否只是追加在末尾（顺序加载），否则说明需要重置播放进度
   */
  appended: boolean;
};

/**
 * 合并新加载的弹幕分段，顺序加载时保持已有下标稳定
 */
export function mergeDanmakuSegments(
  existing: DanmakuItem[],
  incoming: DanmakuItem[],
): DanmakuMergeResult {
  if (incoming.length === 0) {
    return { items: existing, appended: true };
  }
  if (existing.length === 0) {
    return { items: sortDanmakuItems(incoming), appended: true };
  }
  const last = existing[existing.length - 1];
  if (incoming[0].progressMs >= last.progressMs) {
    return { items: [...existing, ...incoming], appended: true };
  }
  return { items: sortDanmakuItems([...existing, ...incoming]), appended: false };
}

/**
 * 消费已到时间的弹幕，分配轨道并计算移动参数；轨道满了直接丢弃
 */
export function resolveDanmakuBatch(
  items: DanmakuItem[],
  nextIndex: number,
  lanes: number[],
  options: DanmakuTrackOptions,
): DanmakuTrackResult {
  const { currentTimeMs, containerWidth, containerHeight } = options;
  const fontSize = options.fontSize ?? DANMAKU_DEFAULT_FONTSIZE;
  const laneHeight = options.laneHeight ?? Math.round(fontSize * 1.7);
  const crossSeconds = options.crossSeconds ?? DANMAKU_DEFAULT_CROSS_SECONDS;

  const laneCount = resolveDanmakuLaneCount(containerHeight, laneHeight);
  const laneFreeAt =
    lanes.length === laneCount ? [...lanes] : Array.from({ length: laneCount }, () => 0);
  const created: DanmakuRenderItem[] = [];
  const speed = containerWidth / Math.max(1, crossSeconds);

  let index = Math.max(0, Math.min(nextIndex, items.length));

  while (index < items.length && items[index].progressMs <= currentTimeMs) {
    const item = items[index];
    index += 1;

    if (!item.content || speed <= 0) {
      continue;
    }

    const textWidth = estimateDanmakuWidth(item.content, fontSize);
    const travel = containerWidth + textWidth;
    const durationMs = (travel / speed) * 1000;
    const lane = laneFreeAt.findIndex((freeAt) => freeAt <= currentTimeMs);
    if (lane < 0) {
      continue;
    }

    laneFreeAt[lane] = currentTimeMs + (durationMs * textWidth) / travel;
    created.push({
      key: `${index}-${item.progressMs}`,
      content: item.content,
      color: toDanmakuColor(item.color),
      fontSize,
      lane,
      top: lane * laneHeight,
      textWidth,
      startX: containerWidth,
      travel,
      startMs: currentTimeMs,
      durationMs,
    });
  }

  return { items: created, lanes: laneFreeAt, nextIndex: index };
}
