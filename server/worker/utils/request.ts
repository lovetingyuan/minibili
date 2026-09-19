import { MAX_SYNC_BYTES, MAX_SYNC_KEYS } from "../../../shared/user-data";
import type { JsonValue, SyncOperations } from "../../../shared/user-data";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isKey(key: string) {
  return /^[\w$:.-]{1,128}$/.test(key) && !["__proto__", "constructor", "prototype"].includes(key);
}

function isJson(value: unknown, depth = 0): value is JsonValue {
  if (depth > 32) {
    return false;
  }
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return true;
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    return value.every((item) => isJson(item, depth + 1));
  }
  return isRecord(value) && Object.values(value).every((item) => isJson(item, depth + 1));
}

export function parseSyncOperations(value: unknown): SyncOperations | null {
  if (
    !isRecord(value) ||
    Object.keys(value).some((key) => !["get", "set", "delete"].includes(key))
  ) {
    return null;
  }
  const operations: SyncOperations = {};
  const keys = new Set<string>();
  for (const operation of ["get", "delete"] as const) {
    const list = value[operation];
    if (list === undefined) {
      continue;
    }
    if (
      !Array.isArray(list) ||
      list.length > MAX_SYNC_KEYS ||
      !list.every((key): key is string => typeof key === "string" && isKey(key))
    ) {
      return null;
    }
    operations[operation] = [...new Set(list)];
    list.forEach((key) => keys.add(key));
  }
  if (value.set !== undefined) {
    if (!isRecord(value.set)) {
      return null;
    }
    const entries: [string, JsonValue][] = [];
    for (const [key, item] of Object.entries(value.set)) {
      if (!isKey(key) || !isJson(item)) {
        return null;
      }
      entries.push([key, item]);
      keys.add(key);
    }
    operations.set = Object.fromEntries(entries);
  }
  return keys.size > 0 && keys.size <= MAX_SYNC_KEYS ? operations : null;
}

export class SyncPayloadTooLargeError extends Error {}

// 读取流时计数，不信任 Content-Length，也不先将无限请求体加载到内存。
export async function readSyncBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) {
    return null;
  }
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      size += value.byteLength;
      if (size > MAX_SYNC_BYTES) {
        await reader.cancel();
        throw new SyncPayloadTooLargeError();
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof SyncPayloadTooLargeError) {
      throw error;
    }
    return null;
  } finally {
    reader.releaseLock();
  }
}
