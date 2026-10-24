import type {
  BilibiliAuthExpiredCode,
  BilibiliAuthExpirationSnapshot,
} from "./auth-expiration.types";

export type { BilibiliAuthExpiredCode } from "./auth-expiration.types";

export class BilibiliAuthExpiredError extends Error {
  readonly code: BilibiliAuthExpiredCode;
  readonly url?: string;

  constructor(code: BilibiliAuthExpiredCode, message?: string, url?: string) {
    super(message || "B站登录已失效，请重新登录");
    this.name = "BilibiliAuthExpiredError";
    this.code = code;
    this.url = url;
  }
}

const listeners = new Set<() => void>();
let snapshot: BilibiliAuthExpirationSnapshot = {
  error: null,
  version: 0,
  confirmedGeneration: null,
};

function publish(error: BilibiliAuthExpiredError | null, confirmedGeneration: number | null = null) {
  snapshot = { error, version: snapshot.version + 1, confirmedGeneration };
  listeners.forEach((listener) => listener());
}

export function isBilibiliAuthExpiredCode(code: number): code is BilibiliAuthExpiredCode {
  return code === -101 || code === -111;
}

export function reportBilibiliAuthExpired(
  code: BilibiliAuthExpiredCode,
  message?: string,
  url?: string,
) {
  const error = new BilibiliAuthExpiredError(code, message, url);
  if (!snapshot.error) {
    publish(error);
  }
  return error;
}

export function confirmBilibiliAuthExpired(generation: number) {
  if (snapshot.confirmedGeneration !== generation) {
    publish(new BilibiliAuthExpiredError(-101), generation);
  }
}

export function clearBilibiliAuthExpiration() {
  if (snapshot.error) {
    publish(null);
  }
}

export const bilibiliAuthExpiration = {
  getSnapshot: () => snapshot,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
