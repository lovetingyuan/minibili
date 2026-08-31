export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SyncOperations = {
  get?: string[];
  set?: Record<string, JsonValue>;
  delete?: string[];
};

export type SyncResult = {
  success: true;
  uid: string;
  result: Record<string, JsonValue>;
};

export const MAX_SYNC_BYTES = 128 * 1024;
export const MAX_SYNC_KEYS = 128;
