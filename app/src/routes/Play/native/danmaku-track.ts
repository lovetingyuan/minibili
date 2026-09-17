import type { DanmakuItem } from "@/api/danmaku.types";

export const DANMAKU_DEFAULT_FONTSIZE = 16;

/**
 * 一条滚动弹幕从「左边缘贴右边界」到「右边缘贴左边界」的总时长。
 * 对齐 B站网页播放器默认设置下的实测值（约 7.07s，与文本长度无关）
 */
export const DANMAKU_SCROLL_DURATION_MS = 7000;

/**
 * 轨道高度相对字号的倍率
 */
const DANMAKU_LANE_HEIGHT_RATIO = 1.7;

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
   * 弹幕自身的出现时间（毫秒），位置由它与播放进度共同决定
   */
  progressMs: number;
  /**
   * 从右侧屏外到左侧屏外的总时长（毫秒）
   */
  durationMs: number;
  /**
   * 挂载时已经过去的时长（毫秒）
   */
  elapsedMs: number;
  /**
   * 挂载时应处的横坐标
   */
  currentX: number;
  /**
   * 完全离开左侧时的横坐标
   */
  endX: number;
};

export type DanmakuLayoutOptions = {
  containerWidth: number;
  containerHeight: number;
  fontSize?: number;
  laneHeight?: number;
};

export type DanmakuLayout = {
  /**
   * 每条弹幕的轨道下标，-1 表示轨道占满被丢弃
   */
  lanes: Int16Array;
  containerWidth: number;
  containerHeight: number;
  laneHeight: number;
  laneCount: number;
  fontSize: number;
};

export type DanmakuVisibleQuery = {
  currentTimeMs: number;
  /**
   * 弹幕从这一刻开始渲染，更早的弹幕不补画（跳转/续播/开关弹幕后重新开始）
   */
  anchorTimeMs: number;
};

export type DanmakuAnimation = {
  startX: number;
  endX: number;
  durationMs: number;
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

/**
 * 轨道高度：字号越大轨道越高，同一轨道的弹幕纵向不重叠
 */
export function resolveDanmakuLaneHeight(fontSize: number) {
  return Math.max(1, Math.round(fontSize * DANMAKU_LANE_HEIGHT_RATIO));
}

export function resolveDanmakuLaneCount(containerHeight: number, laneHeight: number) {
  return Math.max(1, Math.floor(containerHeight / laneHeight));
}

function resolveLaneHeight(options: DanmakuLayoutOptions) {
  const fontSize = options.fontSize ?? DANMAKU_DEFAULT_FONTSIZE;
  return options.laneHeight ?? resolveDanmakuLaneHeight(fontSize);
}

/**
 * 弹幕横向速度：全程时长固定，文本越宽移动越快
 */
export function resolveDanmakuSpeed(containerWidth: number, textWidth: number) {
  return ((containerWidth + textWidth) * 1000) / DANMAKU_SCROLL_DURATION_MS;
}

/**
 * 弹幕在播放进度 currentTimeMs 时的横坐标：
 * 出现时间点位于右边界外，之后线性左移，走完整程刚好完全离开左侧
 */
export function resolveDanmakuX(
  progressMs: number,
  textWidth: number,
  containerWidth: number,
  currentTimeMs: number,
) {
  const elapsed = currentTimeMs - progressMs;
  if (elapsed <= 0) {
    return containerWidth;
  }
  if (elapsed >= DANMAKU_SCROLL_DURATION_MS) {
    return -textWidth;
  }
  return containerWidth - (resolveDanmakuSpeed(containerWidth, textWidth) * elapsed) / 1000;
}

/**
 * 恢复播放时按最新媒体时间重新定位，再播放剩余路程。
 * 这样 JS 在后台暂停、前台恢复后不会从旧坐标重新跑一遍。
 */
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

/**
 * 轨道可以放下一条弹幕的播放时间：前一条弹幕的尾部完全进入右边界之后
 */
export function resolveDanmakuLaneFreeAt(
  progressMs: number,
  textWidth: number,
  containerWidth: number,
) {
  const travel = containerWidth + textWidth;
  if (travel <= 0) {
    return progressMs + DANMAKU_SCROLL_DURATION_MS;
  }
  return progressMs + (DANMAKU_SCROLL_DURATION_MS * textWidth) / travel;
}

/**
 * 轨道表是否仍适用于当前容器尺寸
 */
export function isDanmakuLayoutFresh(layout: DanmakuLayout, options: DanmakuLayoutOptions) {
  return (
    layout.containerWidth === options.containerWidth &&
    layout.containerHeight === options.containerHeight &&
    layout.fontSize === (options.fontSize ?? DANMAKU_DEFAULT_FONTSIZE) &&
    layout.laneHeight === resolveLaneHeight(options)
  );
}

/**
 * 按弹幕自身时间前向分配轨道：取第一条空闲的轨道，没有空闲轨道则丢弃。
 * 结果只取决于弹幕数据与容器尺寸，与播放进度无关，跳转后依然是同一张轨道表
 */
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
  const laneFreeAt = Array.from({ length: laneCount }, () => 0);

  if (containerWidth > 0) {
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item.content) {
        continue;
      }
      const textWidth = estimateDanmakuWidth(item.content, fontSize);
      const lane = laneFreeAt.findIndex((freeAt) => freeAt <= item.progressMs);
      if (lane < 0) {
        continue;
      }
      lanes[index] = lane;
      laneFreeAt[lane] = resolveDanmakuLaneFreeAt(item.progressMs, textWidth, containerWidth);
    }
  }

  return {
    lanes,
    containerWidth,
    containerHeight: options.containerHeight,
    laneHeight,
    laneCount,
    fontSize,
  };
}

/**
 * 找出第一条不早于 minProgressMs 的弹幕下标（items 按 progressMs 升序）
 */
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

/**
 * 合并本地回显与网络弹幕（共用同一张轨道表）。
 * 本地弹幕数量很少，直接合并后排序，顺带兜住「回跳后再发送」导致的乱序
 */
export function mergeDanmakuItems(items: DanmakuItem[], incoming: DanmakuItem[]) {
  if (incoming.length === 0) {
    return items;
  }
  return [...items, ...incoming].sort((a, b) => a.progressMs - b.progressMs);
}

/**
 * 挑出当前应当渲染的弹幕：出现时间落在 [max(anchor, 当前进度 - 全程时长), 当前进度]
 * 且分配到了轨道，位置与剩余时长按播放进度推导
 */
export function selectVisibleDanmaku(
  items: DanmakuItem[],
  layout: DanmakuLayout,
  query: DanmakuVisibleQuery,
): DanmakuRenderItem[] {
  const { currentTimeMs, anchorTimeMs } = query;
  const { lanes, laneCount, laneHeight, fontSize, containerWidth } = layout;
  if (containerWidth <= 0 || laneCount <= 0 || lanes.length !== items.length) {
    return [];
  }

  const minProgressMs = Math.max(anchorTimeMs, currentTimeMs - DANMAKU_SCROLL_DURATION_MS);
  const visible: DanmakuRenderItem[] = [];

  for (let index = findVisibleStartIndex(items, minProgressMs); index < items.length; index += 1) {
    const item = items[index];
    if (item.progressMs > currentTimeMs) {
      break;
    }
    const lane = lanes[index];
    if (lane < 0) {
      continue;
    }
    const textWidth = estimateDanmakuWidth(item.content, fontSize);
    visible.push({
      key: `${index}-${item.progressMs}`,
      content: item.content,
      color: toDanmakuColor(item.color),
      fontSize,
      lane,
      top: lane * laneHeight,
      textWidth,
      progressMs: item.progressMs,
      durationMs: DANMAKU_SCROLL_DURATION_MS,
      elapsedMs: currentTimeMs - item.progressMs,
      currentX: resolveDanmakuX(item.progressMs, textWidth, containerWidth, currentTimeMs),
      endX: -textWidth,
    });
  }

  return visible;
}
