import { getStoreMethods, useStore } from ".";

import type { WatchProgressMap } from "../api/watch-progress.types";
import type { WatchProgressSnapshot } from "../utils/watch-progress";

/** 观看历史接口里的进度比例，供各视频封面展示 */
export function useWatchProgressRatio(bvid: string) {
  const { watchProgressMap } = useStore();
  return watchProgressMap[bvid]?.ratio ?? 0;
}

function normalizeWatchProgress(map: WatchProgressMap) {
  const next: WatchProgressMap = {};
  for (const [bvid, snapshot] of Object.entries(map)) {
    const key = bvid.trim();
    if (!key || !Number.isFinite(snapshot?.ratio) || !Number.isFinite(snapshot?.updatedAt)) {
      continue;
    }
    next[key] = { ratio: snapshot.ratio, updatedAt: snapshot.updatedAt };
  }
  return next;
}

function isSameWatchProgress(current: WatchProgressMap, next: WatchProgressMap) {
  const nextKeys = Object.keys(next);
  return (
    Object.keys(current).length === nextKeys.length &&
    nextKeys.every(
      (key) =>
        current[key]?.ratio === next[key].ratio && current[key]?.updatedAt === next[key].updatedAt,
    )
  );
}

/**
 * 单条快照的合并规则：服务端结果只在「更晚且有效」时覆盖已有值。
 * 比例为 0 说明接口没有记录进度，用它覆盖会抹掉本地刚记录的进度；
 * 同一秒内服务端的时间戳会早于本地写入的毫秒时间戳，同样保留本地值。
 */
function pickWatchProgressSnapshot(
  current: WatchProgressSnapshot | undefined,
  next: WatchProgressSnapshot,
) {
  if (next.ratio <= 0) {
    return current;
  }
  if (current && next.updatedAt <= current.updatedAt) {
    return current;
  }
  return next;
}

/** 用服务端结果整体覆盖进度；内容一致时不写入，避免无谓重渲染 */
export function replaceWatchProgress(map: WatchProgressMap) {
  const next = normalizeWatchProgress(map);
  const methods = getStoreMethods();
  if (isSameWatchProgress(methods.getWatchProgressMap(), next)) {
    return;
  }
  methods.setWatchProgressMap(next);
}

/** 按 bvid 合并最新拿到的进度；内容一致时不写入 */
export function mergeWatchProgress(map: WatchProgressMap) {
  const next = normalizeWatchProgress(map);
  if (!Object.keys(next).length) {
    return;
  }
  const methods = getStoreMethods();
  const current = methods.getWatchProgressMap();
  const merged: WatchProgressMap = { ...current };
  for (const [bvid, snapshot] of Object.entries(next)) {
    const picked = pickWatchProgressSnapshot(current[bvid], snapshot);
    if (picked) {
      merged[bvid] = picked;
    }
  }
  if (isSameWatchProgress(current, merged)) {
    return;
  }
  methods.setWatchProgressMap(merged);
}

/**
 * 播放页把本地已知的播放进度写进 store：返回列表时封面进度条立即生效，
 * 不必等 B站写入观看历史（首次观看时服务端往往还没这条记录）。
 * 比例无效、不大于 0（无进度或时长未知）时不写入。
 */
export function recordLocalWatchProgress(bvid: string, ratio: number) {
  const key = bvid.trim();
  if (!key || !Number.isFinite(ratio) || ratio <= 0) {
    return;
  }
  mergeWatchProgress({ [key]: { ratio: Math.min(1, ratio), updatedAt: Date.now() } });
}

export function clearWatchProgress() {
  const methods = getStoreMethods();
  if (!Object.keys(methods.getWatchProgressMap()).length) {
    return;
  }
  methods.setWatchProgressMap({});
}
