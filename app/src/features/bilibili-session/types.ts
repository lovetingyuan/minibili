import type { BilibiliProfile } from "../../api/bilibili-auth.types";

export type BilibiliAccount = {
  mid: string;
  generation: number;
  profile: BilibiliProfile;
};

export type BilibiliSessionControl = {
  generation: number;
  phase: "ready" | "logging-out" | "logout-error";
  error: Error | null;
};

export type BilibiliSessionDependencies = {
  readCookie: () => Promise<string | null>;
  saveCookie: (cookie: string) => Promise<void>;
  clearCookie: () => Promise<void>;
  clearNativeCookies: () => Promise<void>;
  writeWebViewCookies: (cookie: string) => Promise<void>;
  validateCookie: (cookie: string, signal?: AbortSignal) => Promise<BilibiliProfile | null>;
};
