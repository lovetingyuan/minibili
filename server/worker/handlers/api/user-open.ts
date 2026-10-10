import { MAX_SYNC_BYTES } from "../../../../shared/user-data.constants";
import { UserOpenRequestSchema } from "../../../../shared/user-data.schema";
import { createDb } from "../../db/client";
import { recordUserOpen } from "../../db/users";
import { authenticateUserRequest, getAppVersion } from "../../services/user-auth";
import type { AppContext } from "../../types";
import { readJsonBody, RequestPayloadTooLargeError } from "../../utils/request";

export async function handleUserOpen(c: AppContext) {
  c.header("Cache-Control", "no-store");
  if (!c.req.header("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return c.json({ success: false, error: "启动登记格式错误" }, 400);
  }
  try {
    if (!UserOpenRequestSchema.safeParse(await readJsonBody(c.req.raw, MAX_SYNC_BYTES)).success) {
      return c.json({ success: false, error: "启动登记格式错误" }, 400);
    }
  } catch (error) {
    if (error instanceof RequestPayloadTooLargeError) {
      return c.json({ success: false, error: "请求数据过大" }, 413);
    }
    throw error;
  }
  const identity = await authenticateUserRequest(c);
  if (identity instanceof Response) {
    return identity;
  }
  try {
    await recordUserOpen(createDb(c.env.DB), {
      ...identity,
      appVersion: getAppVersion(c.req.header("X-MiniBili-App-Version")),
      openedAt: Date.now(),
    });
    return c.json({ success: true, uid: identity.uid });
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "user open registration failed",
        uid: identity.uid,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return c.json({ success: false, error: "启动登记暂时不可用" }, 503);
  }
}
