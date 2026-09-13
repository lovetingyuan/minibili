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

export function getDanmakuSegmentCount(durationSeconds: number) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(durationSeconds / DANMAKU_SEGMENT_SECONDS));
}

async function requestDanmakuSegment(cid: number, index: number) {
  const url = `https://api.bilibili.com/x/v2/dm/web/seg.so?type=1&oid=${cid}&segment_index=${index}`;
  const headers = createBilibiliRequestHeaders(
    url,
    {
      "user-agent": UA,
      referer: "https://www.bilibili.com",
      origin: "https://www.bilibili.com",
    },
    await getCookie(),
  );
  const response = await expoFetch(url, { headers });
  // 越界的分段会返回 304
  if (response.status !== 200) {
    return [] as DanmakuItem[];
  }
  const buffer = await response.arrayBuffer();
  return decodeDanmakuSegment(new Uint8Array(buffer));
}

/**
 * 拉取一个弹幕分段，失败时静默返回空数组（弹幕不是关键路径）
 */
export function fetchDanmakuSegment(cid: number, index: number): Promise<DanmakuItem[]> {
  const key = `${cid}-${index}`;
  const cached = segmentCache.get(key);
  if (cached) {
    return cached;
  }

  const task = requestDanmakuSegment(cid, index).catch(() => {
    segmentCache.delete(key);
    return [] as DanmakuItem[];
  });
  segmentCache.set(key, task);
  return task;
}
