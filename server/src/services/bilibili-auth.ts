import { isRecord } from "../utils/request";

const MYINFO_URL = "https://api.bilibili.com/x/space/v2/myinfo";
export const AUTH_TIMEOUT_MS = 15000;

export class BilibiliUnauthorizedError extends Error {}
export class BilibiliUnavailableError extends Error {}

export async function verifyBilibiliIdentity(cookie: string | undefined): Promise<string> {
  if (
    !cookie ||
    cookie.length > 16384 ||
    cookie.includes("\0") ||
    /[\r\n]/.test(cookie) ||
    !/(?:^|;)\s*SESSDATA=[^;\s]+/.test(cookie)
  ) {
    throw new BilibiliUnauthorizedError();
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const response = await fetch(MYINFO_URL, {
      headers: {
        cookie,
        accept: "application/json",
        referer: "https://space.bilibili.com/",
        "user-agent": "Mozilla/5.0",
        "cache-control": "no-cache",
      },
      // Workers 只支持 follow/manual；不跟随重定向，并由下方 !ok 拒绝 3xx。
      redirect: "manual",
      signal: controller.signal,
    });
    if (!response.ok) throw new BilibiliUnavailableError();
    const payload: unknown = await response.json();
    if (!isRecord(payload)) throw new BilibiliUnavailableError();
    if (payload.code === -101) throw new BilibiliUnauthorizedError();
    if (payload.code !== 0 || !isRecord(payload.data) || !isRecord(payload.data.profile)) {
      throw new BilibiliUnavailableError();
    }
    const mid = payload.data.profile.mid;
    if (typeof mid !== "number" || !Number.isSafeInteger(mid) || mid <= 0) {
      throw new BilibiliUnavailableError();
    }
    // 唯一可信的身份来自 B站响应，而非 DedeUserID、URL 或请求体。
    return String(mid);
  } catch (error) {
    if (error instanceof BilibiliUnauthorizedError) throw error;
    throw new BilibiliUnavailableError();
  } finally {
    clearTimeout(timeout);
  }
}
