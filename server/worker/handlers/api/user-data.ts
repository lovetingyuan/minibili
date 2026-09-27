import type { AppContext } from "../../types";
import { BilibiliUnauthorizedError, verifyBilibiliIdentity } from "../../services/bilibili-auth";
import type { BilibiliIdentity } from "../../services/bilibili-auth.types";
import { getClientIp, isRateLimited, RATE_LIMIT_RETRY_AFTER } from "../../utils/rate-limit";
import { parseSyncOperations, readSyncBody, SyncPayloadTooLargeError } from "../../utils/request";

const USER_DIRECTORY_NAME = "global";
const RATE_LIMITED_MESSAGE = "请求过于频繁，请稍后再试";

export async function handleSyncUserData(c: AppContext) {
  c.header("Cache-Control", "no-store");
  if (!c.req.header("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return c.json({ success: false, error: "同步请求格式错误" }, 400);
  }
  let operations;
  try {
    operations = parseSyncOperations(await readSyncBody(c.req.raw));
  } catch (error) {
    if (error instanceof SyncPayloadTooLargeError) {
      return c.json({ success: false, error: "请求数据过大" }, 413);
    }
    throw error;
  }
  if (!operations) {
    return c.json({ success: false, error: "同步请求格式错误" }, 400);
  }
  // 先按 IP 限流：未登录请求同样会触发一次 B站 myinfo 调用，必须挡在上游之前。
  if (await isRateLimited(c.env.RATE_LIMIT_SYNC, "sync:ip", getClientIp(c))) {
    c.header("Retry-After", RATE_LIMIT_RETRY_AFTER);
    return c.json({ success: false, error: RATE_LIMITED_MESSAGE }, 429);
  }
  let identity: BilibiliIdentity;
  try {
    identity = await verifyBilibiliIdentity(c.env, c.req.header("X-Bilibili-Cookie"));
  } catch (error) {
    return error instanceof BilibiliUnauthorizedError
      ? c.json({ success: false, error: "请重新登录 B站" }, 401)
      : c.json({ success: false, error: "暂时无法验证 B站登录状态，请稍后重试" }, 503);
  }
  // 再按 uid 限流，避免单一账号分散到多个出口 IP 后打爆存储写入。
  if (await isRateLimited(c.env.RATE_LIMIT_SYNC, "sync:uid", identity.uid)) {
    c.header("Retry-After", RATE_LIMIT_RETRY_AFTER);
    return c.json({ success: false, error: RATE_LIMITED_MESSAGE }, 429);
  }
  try {
    const result = await c.env.USER_STORAGE.getByName(identity.uid).syncData(operations);
    await c.env.USER_DIRECTORY.getByName(USER_DIRECTORY_NAME).recordActivity({
      uid: identity.uid,
      nickname: identity.nickname,
      usedAt: Date.now(),
    });
    return c.json({ success: true, uid: identity.uid, result });
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "user data sync failed",
        error: error instanceof Error ? error.message : String(error),
        uid: identity.uid,
      }),
    );
    return c.json({ success: false, error: "设置同步暂时不可用，请稍后重试" }, 503);
  }
}
