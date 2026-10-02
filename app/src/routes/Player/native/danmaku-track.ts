import type { DanmakuItem } from "@/api/danmaku.types";

import { DANMAKU_FIXED_DURATION_MS, resolveDanmakuDuration } from "./danmaku-duration";
import type {
  DanmakuAnimation,
  DanmakuLaneOccupant,
  DanmakuLayout,
  DanmakuLayoutOptions,
  DanmakuRenderItem,
  DanmakuVisibleQuery,
} from "./danmaku-track.types";

export const DANMAKU_DEFAULT_FONTSIZE = 16;
const DANMAKU_LANE_HEIGHT_RATIO = 1.7;
const DANMAKU_GAP = 4;
// 合并乱序分段、插入本地弹幕都不能改变已经挂载的动画身份。
const itemKeys = new WeakMap<DanmakuItem, string>();
let nextItemKey = 0;

function getItemKey(item: DanmakuItem) {
  let key = itemKeys.get(item);
  if (!key) {
    key = String(nextItemKey++);
    itemKeys.set(item, key);
  }
  return key;
}

export function estimateDanmakuWidth(content: string, fontSize: number) {
  let width = 0;
  for (const char of content) {
    width += (char.codePointAt(0) ?? 0) >= 0x2e80 ? fontSize : fontSize * 0.55;
  }
  return Math.ceil(width * 1.02);
}

export function toDanmakuColor(color: number) {
  return `#${Math.max(0, Math.min(0xffffff, Math.floor(color)))
    .toString(16)
    .padStart(6, "0")}`;
}

export function resolveDanmakuLaneHeight(fontSize: number) {
  return Math.max(1, Math.round(fontSize * DANMAKU_LANE_HEIGHT_RATIO));
}

export function resolveDanmakuLaneCount(containerHeight: number, laneHeight: number) {
  return Math.max(0, Math.floor(containerHeight / laneHeight));
}

function resolveLaneHeight(options: DanmakuLayoutOptions) {
  return (
    options.laneHeight ?? resolveDanmakuLaneHeight(options.fontSize ?? DANMAKU_DEFAULT_FONTSIZE)
  );
}

export function resolveDanmakuSpeed(containerWidth: number, textWidth: number) {
  return ((containerWidth + textWidth) * 1000) / resolveDanmakuDuration(containerWidth, textWidth);
}

export function resolveDanmakuX(
  progressMs: number,
  textWidth: number,
  containerWidth: number,
  currentTimeMs: number,
) {
  const elapsed = Math.max(0, currentTimeMs - progressMs);
  return Math.max(
    -textWidth,
    containerWidth - (resolveDanmakuSpeed(containerWidth, textWidth) * elapsed) / 1000,
  );
}

export function resolveDanmakuAnimation(
  item: Pick<DanmakuRenderItem, "currentX" | "durationMs" | "elapsedMs" | "endX">,
  playbackRate: number,
): DanmakuAnimation {
  const remainingMs = Math.max(0, item.durationMs - item.elapsedMs);
  return {
    startX: item.currentX,
    endX: item.endX,
    durationMs:
      remainingMs === 0 ? 0 : Math.max(16, Math.round(remainingMs / Math.max(0.1, playbackRate))),
  };
}

export function isDanmakuLayoutFresh(layout: DanmakuLayout, options: DanmakuLayoutOptions) {
  return (
    layout.containerWidth === options.containerWidth &&
    layout.containerHeight === options.containerHeight &&
    layout.fontSize === (options.fontSize ?? DANMAKU_DEFAULT_FONTSIZE) &&
    layout.laneHeight === resolveLaneHeight(options)
  );
}

function canUseScrollLane(
  previous: DanmakuLaneOccupant | undefined,
  incoming: DanmakuLaneOccupant,
  containerWidth: number,
) {
  if (!previous || previous.progressMs + previous.durationMs <= incoming.progressMs) {
    return true;
  }
  const speed = resolveDanmakuSpeed(containerWidth, previous.textWidth);
  const previousRight =
    containerWidth -
    (speed * (incoming.progressMs - previous.progressMs)) / 1000 +
    previous.textWidth;
  // 除了尾部已入屏，还要保证更快的新弹幕到达左边缘前不会追上前一条。
  const reachLeftAt =
    incoming.progressMs +
    (containerWidth / resolveDanmakuSpeed(containerWidth, incoming.textWidth)) * 1000;
  return (
    previousRight + DANMAKU_GAP <= containerWidth &&
    previous.progressMs + previous.durationMs + (DANMAKU_GAP / speed) * 1000 <= reachLeftAt
  );
}

/** 时间轴排序后分配轨道，滚动、顶部、底部各自检查碰撞。 */
export function resolveDanmakuLayout(
  items: DanmakuItem[],
  options: DanmakuLayoutOptions,
): DanmakuLayout {
  const fontSize = options.fontSize ?? DANMAKU_DEFAULT_FONTSIZE;
  const laneHeight = resolveLaneHeight(options);
  const laneCount = resolveDanmakuLaneCount(options.containerHeight, laneHeight);
  const containerWidth = options.containerWidth;
  const lanes = new Int16Array(items.length);
  lanes.fill(-1);
  const scrollLanes: (DanmakuLaneOccupant | undefined)[] = Array.from({ length: laneCount });
  const topFreeAt = Array.from({ length: laneCount }, () => 0);
  const bottomFreeAt = Array.from({ length: laneCount }, () => 0);
  let maxDurationMs = DANMAKU_FIXED_DURATION_MS;

  if (containerWidth > 0) {
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item.content) {
        continue;
      }
      if (item.mode) {
        const freeAt = item.mode === 4 ? bottomFreeAt : topFreeAt;
        const lane = freeAt.findIndex((time) => time <= item.progressMs);
        if (lane >= 0) {
          lanes[index] = lane;
          freeAt[lane] = item.progressMs + DANMAKU_FIXED_DURATION_MS;
        }
        continue;
      }
      const textWidth = estimateDanmakuWidth(item.content, fontSize);
      const durationMs = resolveDanmakuDuration(containerWidth, textWidth);
      maxDurationMs = Math.max(maxDurationMs, durationMs);
      const occupant = { progressMs: item.progressMs, textWidth, durationMs };
      const lane = scrollLanes.findIndex((previous) =>
        canUseScrollLane(previous, occupant, containerWidth),
      );
      if (lane >= 0) {
        lanes[index] = lane;
        scrollLanes[lane] = occupant;
      }
    }
  }
  return {
    lanes,
    containerWidth,
    containerHeight: options.containerHeight,
    laneHeight,
    laneCount,
    fontSize,
    maxDurationMs,
  };
}

export function findVisibleStartIndex(items: DanmakuItem[], minProgressMs: number) {
  let low = 0;
  let high = items.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (items[middle].progressMs < minProgressMs) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  return low;
}

export function mergeDanmakuItems(items: DanmakuItem[], incoming: DanmakuItem[]) {
  return incoming.length === 0
    ? items
    : [...items, ...incoming].sort((a, b) => a.progressMs - b.progressMs);
}

/** 跳转和数据晚到时补画仍在有效期内的弹幕，位置始终由媒体时间决定。 */
export function selectVisibleDanmaku(
  items: DanmakuItem[],
  layout: DanmakuLayout,
  query: DanmakuVisibleQuery,
): DanmakuRenderItem[] {
  const { currentTimeMs } = query;
  const { lanes, laneCount, laneHeight, fontSize, containerWidth, containerHeight } = layout;
  if (containerWidth <= 0 || laneCount <= 0 || lanes.length !== items.length) {
    return [];
  }
  const visible: DanmakuRenderItem[] = [];
  for (
    let index = findVisibleStartIndex(items, currentTimeMs - layout.maxDurationMs);
    index < items.length;
    index += 1
  ) {
    const item = items[index];
    if (item.progressMs > currentTimeMs) {
      break;
    }
    const lane = lanes[index];
    const textWidth = estimateDanmakuWidth(item.content, fontSize);
    const durationMs = item.mode
      ? DANMAKU_FIXED_DURATION_MS
      : resolveDanmakuDuration(containerWidth, textWidth);
    const elapsedMs = currentTimeMs - item.progressMs;
    if (lane < 0 || elapsedMs >= durationMs) {
      continue;
    }
    const currentX = item.mode
      ? (containerWidth - textWidth) / 2
      : resolveDanmakuX(item.progressMs, textWidth, containerWidth, currentTimeMs);
    visible.push({
      key: getItemKey(item),
      content: item.content,
      color: toDanmakuColor(item.color),
      fontSize,
      mode: item.mode,
      lane,
      top: item.mode === 4 ? containerHeight - (lane + 1) * laneHeight : lane * laneHeight,
      textWidth,
      progressMs: item.progressMs,
      durationMs,
      elapsedMs,
      currentX,
      endX: item.mode ? currentX : -textWidth,
    });
  }
  return visible;
}
