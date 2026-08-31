import type { JsonValue, SyncOperations } from "../../shared/user-data";

export function syncUserData(
  storage: Pick<DurableObjectStorage, "kv" | "transactionSync">,
  operations: SyncOperations,
) {
  return storage.transactionSync(() => {
    for (const key of operations.delete ?? []) storage.kv.delete(key);
    for (const [key, value] of Object.entries(operations.set ?? {})) storage.kv.put(key, value);
    const result: Record<string, JsonValue> = {};
    for (const key of operations.get ?? []) {
      const value = storage.kv.get<JsonValue>(key);
      if (value !== undefined)
        Object.defineProperty(result, key, { value, enumerable: true, configurable: true });
    }
    return result;
  });
}
