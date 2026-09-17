import type { AppContext } from "../../types";
import { BilibiliUnauthorizedError, verifyBilibiliIdentity } from "../../services/bilibili-auth";
import { parseSyncOperations, readSyncBody, SyncPayloadTooLargeError } from "../../utils/request";

export async function handleSyncUserData(c: AppContext) {
  c.header("Cache-Control", "no-store");
  let operations;
  try {
    operations = parseSyncOperations(await readSyncBody(c.req.raw));
  } catch (error) {
    if (error instanceof SyncPayloadTooLargeError)
      return c.json({ success: false, error: "请求数据过大" }, 413);
    throw error;
  }
  if (!operations) return c.json({ success: false, error: "同步请求格式错误" }, 400);
  let uid: string;
  try {
    uid = await verifyBilibiliIdentity(c.env, c.req.header("X-Bilibili-Cookie"));
  } catch (error) {
    return error instanceof BilibiliUnauthorizedError
      ? c.json({ success: false, error: "请重新登录 B站" }, 401)
      : c.json({ success: false, error: "暂时无法验证 B站登录状态，请稍后重试" }, 503);
  }
  try {
    const result = await c.env.USER_STORAGE.getByName(uid).syncData(operations);
    return c.json({ success: true, uid, result });
  } catch {
    return c.json({ success: false, error: "设置同步暂时不可用，请稍后重试" }, 503);
  }
}
