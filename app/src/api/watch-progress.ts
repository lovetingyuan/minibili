import { bilibiliSession } from "../features/bilibili-session/session";
import { mergeWatchProgress, replaceWatchProgress } from "../store/watch-progress";
import { getProgressRatio } from "../utils/watch-progress";
import fetcher from "./fetcher";
import { fetchBilibiliHistory, HISTORY_PAGE_SIZE, INITIAL_HISTORY_CURSOR } from "./history";
import type { HistoryPage, HistoryRecord } from "./history.types";
import type {
  WatchProgressAccount,
  WatchProgressMap,
  WatchProgressRequest,
} from "./watch-progress.types";

/** 最近多少条观看历史参与封面进度，超出部分不再续拉 */
export const WATCH_PROGRESS_RECORD_LIMIT = 100;
/** 从播放页返回时只刷新最新几条 */
const WATCH_PROGRESS_RECENT_SIZE = 5;
/** 兜底：服务端返回异常游标时不要无限续拉 */
const WATCH_PROGRESS_MAX_PAGES = 10;

/** 按 bvid 汇总观看进度；同一 bvid 只保留列表中最近观看的那条 */
export function collectWatchProgress(records: HistoryRecord[]): WatchProgressMap {
  const map: WatchProgressMap = {};
  for (const record of records) {
    if (record.history.business !== "archive") {
      continue;
    }
    const bvid = record.history.bvid?.trim();
    if (!bvid || bvid in map) {
      continue;
    }
    map[bvid] = {
      ratio: getProgressRatio(record.progress ?? 0, record.duration ?? 0, record.is_finish === 1),
      // 接口的观看时间是秒，换算成毫秒便于与本地记录的更新时间比较
      updatedAt: record.view_at * 1000,
    };
  }
  return map;
}

/**
 * 按游标连续取页，累计到最近 100 条观看历史后汇总成进度 map。
 * 首屏失败直接放弃本次同步；后续页失败保留已取到的进度。
 */
export async function fetchWatchProgressMap(
  request: WatchProgressRequest,
  isCurrentAccount: () => boolean,
): Promise<WatchProgressMap> {
  const records: HistoryRecord[] = [];
  let cursor = INITIAL_HISTORY_CURSOR;
  for (let page = 0; page < WATCH_PROGRESS_MAX_PAGES; page += 1) {
    let result: HistoryPage;
    try {
      result = await fetchBilibiliHistory(cursor, request, isCurrentAccount, 0, HISTORY_PAGE_SIZE);
    } catch (error) {
      if (page === 0) {
        throw error;
      }
      break;
    }
    records.push(...result.list);
    if (records.length >= WATCH_PROGRESS_RECORD_LIMIT || !result.hasMore) {
      break;
    }
    cursor = result.cursor;
  }
  return collectWatchProgress(records.slice(0, WATCH_PROGRESS_RECORD_LIMIT));
}

/** 只取最新几条观看历史，用于播放结束后的增量刷新 */
export async function fetchRecentWatchProgressMap(
  request: WatchProgressRequest,
  isCurrentAccount: () => boolean,
): Promise<WatchProgressMap> {
  const result = await fetchBilibiliHistory(
    INITIAL_HISTORY_CURSOR,
    request,
    isCurrentAccount,
    0,
    WATCH_PROGRESS_RECENT_SIZE,
  );
  return collectWatchProgress(result.list);
}

let queue: Promise<void> = Promise.resolve();
const running = new Map<string, Promise<void>>();

/** 串行执行，避免全量与增量请求交叉返回后互相覆盖；失败一律静默 */
function schedule(key: string, task: () => Promise<void>): Promise<void> {
  const pending = running.get(key);
  if (pending) {
    return pending;
  }
  const next = queue.then(task, task).catch(() => {});
  queue = next.then(() => {
    running.delete(key);
  });
  running.set(key, next);
  return next;
}

function isCurrent(account: WatchProgressAccount) {
  return bilibiliSession.isCurrentAccount(account);
}

/** 全量同步最近 100 条观看历史的进度，覆盖 store 中的进度 map */
export function syncWatchProgress(account: WatchProgressAccount): Promise<void> {
  return schedule(`sync:${account.mid}:${account.generation}`, async () => {
    if (!isCurrent(account)) {
      return;
    }
    const map = await fetchWatchProgressMap(fetcher, () => isCurrent(account));
    if (!isCurrent(account)) {
      return;
    }
    replaceWatchProgress(map);
  });
}

/** 播放页离开后按 bvid 合并最新几条观看进度，不全量重拉 */
export function refreshRecentWatchProgress(account: WatchProgressAccount): Promise<void> {
  return schedule(`recent:${account.mid}:${account.generation}`, async () => {
    if (!isCurrent(account)) {
      return;
    }
    const map = await fetchRecentWatchProgressMap(fetcher, () => isCurrent(account));
    if (!isCurrent(account)) {
      return;
    }
    mergeWatchProgress(map);
  });
}
