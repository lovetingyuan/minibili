import type { z } from "zod";
import type { SyncResult, UserDataRequest, UserOpenResult } from "../../../shared/user-data";
import { MAX_SYNC_BYTES } from "../../../shared/user-data.constants";
import { UserDataResponseSchema, UserOpenResponseSchema } from "../../../shared/user-data.schema";
import { serverUrl } from "../constants";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { UserDataUnauthorizedError } from "../features/user-data/errors";
import type { UserDataAccount } from "../features/user-data/types";
import { getBilibiliUserId, hasBilibiliLoginCookie } from "./bilibili-cookie.helpers";
import type { UserApiResult, UserDataRequestDependencies } from "./user-data.types";

export function requestUserData(
  account: UserDataAccount,
  request: UserDataRequest,
  signal: AbortSignal,
  dependencies: UserDataRequestDependencies,
): Promise<SyncResult> {
  return requestUserApi(
    "/api/user-data/sync",
    account,
    request,
    UserDataResponseSchema,
    signal,
    dependencies,
    "设置同步",
  );
}

export function requestUserOpen(
  account: UserDataAccount,
  signal: AbortSignal,
  dependencies: UserDataRequestDependencies,
): Promise<UserOpenResult> {
  return requestUserApi(
    "/api/users/open",
    account,
    {},
    UserOpenResponseSchema,
    signal,
    dependencies,
    "启动登记",
  );
}

async function requestUserApi<T extends UserApiResult>(
  path: "/api/user-data/sync" | "/api/users/open",
  account: UserDataAccount,
  request: UserDataRequest,
  schema: z.ZodType<T>,
  signal: AbortSignal,
  dependencies: UserDataRequestDependencies,
  action: string,
): Promise<T> {
  function assertCurrent() {
    if (signal.aborted || !dependencies.isCurrentAccount(account)) {
      throw new BilibiliSessionChangedError();
    }
  }
  assertCurrent();
  const cookie = await dependencies.readCookie();
  assertCurrent();
  if (!cookie || !hasBilibiliLoginCookie(cookie)) {
    throw new UserDataUnauthorizedError();
  }
  if (getBilibiliUserId(cookie) !== account.mid) {
    throw new BilibiliSessionChangedError();
  }
  const body = JSON.stringify(request);
  if (new TextEncoder().encode(body).byteLength > MAX_SYNC_BYTES) {
    throw new Error("设置数据过大，无法同步");
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort);
  const timeout = setTimeout(abort, 30000);
  const suffix = action === "设置同步" ? "，本地修改已保留" : "";
  try {
    // 凭证仅发送到固定 Worker 入口，禁止重定向和原生 Cookie 附加。
    const response = await dependencies.request(`${serverUrl}${path}`, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        "X-Bilibili-Cookie": cookie,
        ...(dependencies.appVersion ? { "X-MiniBili-App-Version": dependencies.appVersion } : {}),
      },
      credentials: "omit",
      redirect: "error",
      signal: controller.signal,
    });
    assertCurrent();
    if (response.status === 401) {
      throw new UserDataUnauthorizedError();
    }
    if (!response.ok) {
      throw new Error(`${action}失败（HTTP ${response.status}）${suffix}`);
    }
    const parsed = schema.safeParse(await response.json());
    assertCurrent();
    if (!parsed.success) {
      throw new Error(`${action}响应异常${suffix}`);
    }
    if (parsed.data.uid !== account.mid) {
      throw new BilibiliSessionChangedError();
    }
    return parsed.data;
  } catch (error) {
    assertCurrent();
    if (
      error instanceof UserDataUnauthorizedError ||
      error instanceof BilibiliSessionChangedError
    ) {
      throw error;
    }
    throw new Error(
      controller.signal.aborted ? `${action}超时${suffix}` : `${action}失败${suffix}`,
    );
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}
