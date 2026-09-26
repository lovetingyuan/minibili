import { isRecord } from "../utils/request";
import { BILI_MYINFO_PATH, callBilibili } from "./bilibili-proxy";
import type { BilibiliIdentity } from "./bilibili-auth.types";
import type { BilibiliProxyBindings } from "./bilibili-proxy";

export const AUTH_TIMEOUT_MS = 15000;

export class BilibiliUnauthorizedError extends Error {}
export class BilibiliUnavailableError extends Error {}

export async function verifyBilibiliIdentity(
  bindings: BilibiliProxyBindings,
  cookie: string | undefined,
): Promise<BilibiliIdentity> {
  if (
    !cookie ||
    cookie.length > 16384 ||
    cookie.includes("\0") ||
    /[\r\n]/.test(cookie) ||
    !/(?:^|;)\s*SESSDATA=[^;\s]+/.test(cookie)
  ) {
    throw new BilibiliUnauthorizedError();
  }
  try {
    const payload = await callBilibili(bindings, {
      cookie,
      path: BILI_MYINFO_PATH,
      profile: "auth",
      timeoutMs: AUTH_TIMEOUT_MS,
    });
    if (!isRecord(payload)) {
      throw new BilibiliUnavailableError();
    }
    if (payload.code === -101) {
      throw new BilibiliUnauthorizedError();
    }
    if (payload.code !== 0 || !isRecord(payload.data) || !isRecord(payload.data.profile)) {
      throw new BilibiliUnavailableError();
    }
    const mid = payload.data.profile.mid;
    const nickname = payload.data.profile.name;
    if (
      typeof mid !== "number" ||
      !Number.isSafeInteger(mid) ||
      mid <= 0 ||
      typeof nickname !== "string" ||
      !nickname.trim() ||
      nickname.length > 128
    ) {
      throw new BilibiliUnavailableError();
    }
    // 唯一可信的身份来自 B站响应，而非 DedeUserID、URL 或请求体。
    return { uid: String(mid), nickname };
  } catch (error) {
    if (error instanceof BilibiliUnauthorizedError) {
      throw error;
    }
    throw new BilibiliUnavailableError();
  }
}
