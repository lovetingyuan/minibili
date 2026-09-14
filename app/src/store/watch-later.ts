import { getStoreMethods, useStore } from ".";

const AID_PATTERN = /^[1-9]\d*$/;

export function useWatchLaterAids() {
  const { watchLaterAids } = useStore();
  return watchLaterAids;
}

function createAidMap(aids: Iterable<string | number>) {
  const next: Record<string, true> = {};
  for (const aid of aids) {
    const key = String(aid);
    if (AID_PATTERN.test(key)) {
      next[key] = true;
    }
  }
  return next;
}

function isSameAidMap(current: Record<string, true>, next: Record<string, true>) {
  const nextKeys = Object.keys(next);
  return Object.keys(current).length === nextKeys.length && nextKeys.every((key) => key in current);
}

/** 用服务端列表覆盖本地集合；内容一致时不写入，避免无谓重渲染。 */
export function replaceWatchLaterAids(aids: Iterable<string | number>) {
  const next = createAidMap(aids);
  const methods = getStoreMethods();
  if (isSameAidMap(methods.getWatchLaterAids(), next)) {
    return;
  }
  methods.setWatchLaterAids(next);
}

export function markWatchLaterAdded(aid: string | number) {
  const key = String(aid);
  if (!AID_PATTERN.test(key)) {
    return;
  }
  const methods = getStoreMethods();
  const current = methods.getWatchLaterAids();
  if (current[key]) {
    return;
  }
  methods.setWatchLaterAids({ ...current, [key]: true });
}

export function markWatchLaterRemoved(aid: string | number) {
  const key = String(aid);
  const methods = getStoreMethods();
  const current = methods.getWatchLaterAids();
  if (!current[key]) {
    return;
  }
  const next = { ...current };
  delete next[key];
  methods.setWatchLaterAids(next);
}

export function clearWatchLaterAids() {
  const methods = getStoreMethods();
  if (!Object.keys(methods.getWatchLaterAids()).length) {
    return;
  }
  methods.setWatchLaterAids({});
}

export function isWatchLaterAdded(aid?: string | number | null) {
  if (aid === undefined || aid === null) {
    return false;
  }
  return Boolean(getStoreMethods().getWatchLaterAids()[String(aid)]);
}
