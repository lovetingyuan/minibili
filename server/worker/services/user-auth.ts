import type { AppContext } from "../types";
import type { BilibiliIdentity } from "./bilibili-auth.types";
import { BilibiliUnauthorizedError, verifyBilibiliIdentity } from "./bilibili-auth";
import { getClientIp, isRateLimited, RATE_LIMIT_RETRY_AFTER } from "../utils/rate-limit";

export function getAppVersion(value: string | undefined) {
  const version = value?.trim();
  return version && version.length <= 64 ? version : null;
}

export async function authenticateUserRequest(c: AppContext): Promise<BilibiliIdentity | Response> {
  // 启动登记和设置同步共用配额，身份校验前先挡住未登录请求的滥用。
  if (await isRateLimited(c.env.RATE_LIMIT_SYNC, "sync:ip", getClientIp(c))) {
    c.header("Retry-After", RATE_LIMIT_RETRY_AFTER);
    return c.json({ success: false, error: "请求过于频繁，请稍后再试" }, 429);
  }
  let identity: BilibiliIdentity;
  try {
    identity = await verifyBilibiliIdentity(c.env, c.req.header("X-Bilibili-Cookie"));
  } catch (error) {
    return error instanceof BilibiliUnauthorizedError
      ? c.json({ success: false, error: "请重新登录 B站" }, 401)
      : c.json({ success: false, error: "暂时无法验证 B站登录状态，请稍后重试" }, 503);
  }
  if (await isRateLimited(c.env.RATE_LIMIT_SYNC, "sync:uid", identity.uid)) {
    c.header("Retry-After", RATE_LIMIT_RETRY_AFTER);
    return c.json({ success: false, error: "请求过于频繁，请稍后再试" }, 429);
  }
  return identity;
}
