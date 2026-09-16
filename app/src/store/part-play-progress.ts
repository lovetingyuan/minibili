import { getStoreMethods, useStore } from ".";

import type { PartPlayProgressMap, PartPlayProgressSnapshot } from "./part-play-progress.types";

/** 与服务端续播规则一致：不足 5 秒的进度不值得恢复。 */
export const PART_PLAY_PROGRESS_MIN_MS = 5000;

export function getPartPlayProgressKey(bvid: string, cid: number) {
  const normalizedBvid = bvid.trim();
  if (!normalizedBvid || !Number.isSafeInteger(cid) || cid <= 0) {
    return null;
  }
  return `${normalizedBvid}:${cid}`;
}

function isUsableSnapshot(value: unknown): value is PartPlayProgressSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }
  const snapshot = value as Partial<PartPlayProgressSnapshot>;
  return (
    typeof snapshot.positionMs === "number" &&
    Number.isFinite(snapshot.positionMs) &&
    snapshot.positionMs >= PART_PLAY_PROGRESS_MIN_MS &&
    typeof snapshot.durationMs === "number" &&
    Number.isFinite(snapshot.durationMs) &&
    snapshot.durationMs > 0 &&
    snapshot.positionMs < snapshot.durationMs &&
    typeof snapshot.updatedAt === "number" &&
    Number.isFinite(snapshot.updatedAt) &&
    snapshot.updatedAt > 0
  );
}

export function resolvePartPlayProgressPositionMs(
  map: PartPlayProgressMap,
  bvid: string,
  cid: number,
) {
  const key = getPartPlayProgressKey(bvid, cid);
  if (!key) {
    return null;
  }
  const snapshot = map[key];
  return isUsableSnapshot(snapshot) ? Math.round(snapshot.positionMs) : null;
}

export function usePartPlayProgressPosition(bvid: string, cid: number) {
  const { $partPlayProgressMap } = useStore();
  return resolvePartPlayProgressPositionMs($partPlayProgressMap, bvid, cid);
}

export function recordPartPlayProgress(
  bvid: string,
  cid: number,
  positionMs: number,
  durationMs: number,
  updatedAt = Date.now(),
) {
  const key = getPartPlayProgressKey(bvid, cid);
  if (
    !key ||
    !Number.isFinite(positionMs) ||
    positionMs < PART_PLAY_PROGRESS_MIN_MS ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0 ||
    positionMs >= durationMs ||
    !Number.isFinite(updatedAt) ||
    updatedAt <= 0
  ) {
    return;
  }

  const methods = getStoreMethods();
  const current = methods.get$partPlayProgressMap();
  const next: PartPlayProgressSnapshot = {
    positionMs: Math.round(positionMs),
    durationMs: Math.round(durationMs),
    updatedAt: Math.round(updatedAt),
  };
  const previous = current[key];
  if (
    previous?.positionMs === next.positionMs &&
    previous.durationMs === next.durationMs &&
    previous.updatedAt === next.updatedAt
  ) {
    return;
  }
  methods.set$partPlayProgressMap({ ...current, [key]: next });
}

export function clearPartPlayProgress(bvid: string, cid: number) {
  const key = getPartPlayProgressKey(bvid, cid);
  if (!key) {
    return;
  }
  const methods = getStoreMethods();
  const current = methods.get$partPlayProgressMap();
  if (!(key in current)) {
    return;
  }
  const next = { ...current };
  delete next[key];
  methods.set$partPlayProgressMap(next);
}
