import { MAX_SYNC_BYTES } from "../../../../shared/user-data.constants";
import { UserDataRequestSchema } from "../../../../shared/user-data.schema";
import { createDb } from "../../db/client";
import { syncUserData } from "../../db/user-data";
import type { AppContext } from "../../types";
import { authenticateUserRequest, getAppVersion } from "../../services/user-auth";
import { readJsonBody, RequestPayloadTooLargeError } from "../../utils/request";

export async function handleSyncUserData(c: AppContext) {
  c.header("Cache-Control", "no-store");
  if (!c.req.header("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return c.json({ success: false, error: "同步请求格式错误" }, 400);
  }
  let parsed;
  try {
    parsed = UserDataRequestSchema.safeParse(await readJsonBody(c.req.raw, MAX_SYNC_BYTES));
  } catch (error) {
    if (error instanceof RequestPayloadTooLargeError) {
      return c.json({ success: false, error: "请求数据过大" }, 413);
    }
    throw error;
  }
  if (!parsed.success) {
    return c.json({ success: false, error: "同步请求格式错误" }, 400);
  }
  const identity = await authenticateUserRequest(c);
  if (identity instanceof Response) {
    return identity;
  }
  try {
    const settings = await syncUserData(
      createDb(c.env.DB),
      {
        ...identity,
        appVersion: getAppVersion(c.req.header("X-MiniBili-App-Version")),
        openedAt: Date.now(),
      },
      parsed.data.settings ?? {},
    );
    return c.json({ success: true, uid: identity.uid, settings });
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
