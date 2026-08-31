import type { SyncOperations, SyncResult } from "../../../shared/user-data";
import { MAX_SYNC_BYTES } from "../../../shared/user-data";
import { serverUrl } from "../constants";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { UserDataUnauthorizedError } from "../features/user-data/errors";
import type { UserDataAccount } from "../features/user-data/types";
import { getBilibiliUserId, hasBilibiliLoginCookie } from "./bilibili-cookie.helpers";
import { UserDataResponseSchema } from "./user-data.schema";
import type { UserDataRequestDependencies } from "./user-data.types";

export async function requestUserData(
  account: UserDataAccount,
  operations: SyncOperations,
  signal: AbortSignal,
  dependencies: UserDataRequestDependencies,
): Promise<SyncResult> {
  function assertCurrent() {
    if (signal.aborted || !dependencies.isCurrentAccount(account))
      throw new BilibiliSessionChangedError();
  }
  assertCurrent();
  const cookie = await dependencies.readCookie();
  assertCurrent();
  if (!cookie || !hasBilibiliLoginCookie(cookie)) throw new UserDataUnauthorizedError();
  if (getBilibiliUserId(cookie) !== account.mid) throw new BilibiliSessionChangedError();
  const body = JSON.stringify(operations);
  if (new TextEncoder().encode(body).byteLength > MAX_SYNC_BYTES)
    throw new Error("设置数据过大，无法同步");
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort);
  const timeout = setTimeout(abort, 30000);
  try {
    // 这是专用的 Worker 请求，不能复用会向任意 B站 URL 附加 Cookie 的 fetcher。
    const response = await dependencies.request(`${serverUrl}/api/user-data/sync`, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json", "X-Bilibili-Cookie": cookie },
      credentials: "omit",
      redirect: "error",
      signal: controller.signal,
    });
    assertCurrent();
    if (response.status === 401) throw new UserDataUnauthorizedError();
    if (!response.ok) throw new Error(`设置同步失败（HTTP ${response.status}），本地修改已保留`);
    const parsed = UserDataResponseSchema.safeParse(await response.json());
    assertCurrent();
    if (!parsed.success) throw new Error("设置同步响应异常，本地修改已保留");
    if (parsed.data.uid !== account.mid) throw new BilibiliSessionChangedError();
    return parsed.data;
  } catch (error) {
    assertCurrent();
    if (error instanceof UserDataUnauthorizedError || error instanceof BilibiliSessionChangedError)
      throw error;
    throw new Error(
      controller.signal.aborted ? "设置同步超时，本地修改已保留" : "设置同步失败，本地修改已保留",
    );
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}
