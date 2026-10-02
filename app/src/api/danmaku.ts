import { fetch as expoFetch } from "expo/fetch";

import { UA } from "../constants";
import { createBilibiliRequestHeaders } from "./bilibili-cookie.helpers";
import { decodeDanmakuSegment } from "./danmaku-protobuf";
import type { DanmakuItem } from "./danmaku.types";
import { getCookie } from "./get-cookie";

/**
 * B站弹幕分段时长，每段 6 分钟
 */
export const DANMAKU_SEGMENT_SECONDS = 360;

const segmentCache = new Map<string, Promise<DanmakuItem[]>>();

/**
 * 播放进度所在的分段下标，用于发送弹幕后定位需要失效的分段
 */
export function getDanmakuSegmentIndex(progressMs: number) {
  return Math.max(0, Math.floor(progressMs / (DANMAKU_SEGMENT_SECONDS * 1000)));
}

/**
 * 失效一个弹幕分段的缓存，下次拉取时会重新请求（发送弹幕后调用）
 */
export function invalidateDanmakuSegment(cid: number, index: number) {
  segmentCache.delete(`${cid}-${index}`);
}

async function requestDanmakuSegment(cid: number, index: number) {
  // 本地缓存下标从 0 开始，B站接口的 segment_index 从 1 开始。
  const url = `https://api.bilibili.com/x/v2/dm/web/seg.so?type=1&oid=${cid}&segment_index=${index + 1}`;
  const headers = createBilibiliRequestHeaders(
    url,
    {
      "user-agent": UA,
      referer: "https://www.bilibili.com",
      origin: "https://www.bilibili.com",
    },
    await getCookie(),
  );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await expoFetch(url, { headers, signal: controller.signal });
    // 越界的分段会返回 304，按空分段处理
    if (response.status === 304 || response.status === 404) {
      return [] as DanmakuItem[];
    }
    if (response.status !== 200) {
      throw new Error(`弹幕分段请求失败：${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    // 业务错误可能以 HTTP 200 + JSON 返回，不能永久缓存成空弹幕。
    if (new Uint8Array(buffer)[0] === 0x7b) {
      throw new Error("弹幕分段返回异常数据");
    }
    return decodeDanmakuSegment(new Uint8Array(buffer), [1, 2, 3, 4, 5]);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 拉取一个弹幕分段，失败时抛错并清掉缓存，交给调用方重试
 */
export function fetchDanmakuSegment(cid: number, index: number): Promise<DanmakuItem[]> {
  const key = `${cid}-${index}`;
  const cached = segmentCache.get(key);
  if (cached) {
    return cached;
  }

  const task = requestDanmakuSegment(cid, index).catch((error: unknown) => {
    if (segmentCache.get(key) === task) {
      segmentCache.delete(key);
    }
    throw error;
  });
  segmentCache.set(key, task);
  return task;
}
