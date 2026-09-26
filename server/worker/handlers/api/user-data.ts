import type { AppContext } from "../../types";
import { BilibiliUnauthorizedError, verifyBilibiliIdentity } from "../../services/bilibili-auth";
import type { BilibiliIdentity } from "../../services/bilibili-auth.types";
import { parseSyncOperations, readSyncBody, SyncPayloadTooLargeError } from "../../utils/request";

const USER_DIRECTORY_NAME = "global";

export async function handleSyncUserData(c: AppContext) {
  c.header("Cache-Control", "no-store");
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
  let identity: BilibiliIdentity;
  try {
    identity = await verifyBilibiliIdentity(c.env, c.req.header("X-Bilibili-Cookie"));
  } catch (error) {
    return error instanceof BilibiliUnauthorizedError
      ? c.json({ success: false, error: "请重新登录 B站" }, 401)
      : c.json({ success: false, error: "暂时无法验证 B站登录状态，请稍后重试" }, 503);
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
