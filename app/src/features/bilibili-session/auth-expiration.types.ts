import type { BilibiliAuthExpiredError } from "./auth-expiration";

export type BilibiliAuthExpiredCode = -101 | -111;

export type BilibiliAuthExpirationSnapshot = {
  error: BilibiliAuthExpiredError | null;
  version: number;
  confirmedGeneration: number | null;
};
