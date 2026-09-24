import { UA } from "../constants";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  isBilibiliAuthExpiredCode,
  reportBilibiliAuthExpired,
} from "../features/bilibili-session/auth-expiration";
import { LoginRequiredError } from "../features/bilibili-session/login-required";
import {
  createBilibiliRequestHeaders,
  getBilibiliCsrf,
  getBilibiliUserId,
  hasBilibiliLoginCookie,
} from "./bilibili-cookie.helpers";
import { DynamicLikeResponseSchema } from "./dynamic-like.schema";
import type { DynamicLikeChange, DynamicLikeRequestDependencies } from "./dynamic-like.types";
import type { FavoriteAccount } from "./favorites.types";

export class DynamicLikeLoginRequiredError extends LoginRequiredError {}
export class DynamicLikeResultUnknownError extends Error {}

export async function modifyDynamicLike(
  account: FavoriteAccount,
  change: DynamicLikeChange,
  dependencies: DynamicLikeRequestDependencies,
) {
  function assertCurrent() {
    if (!dependencies.isCurrentAccount(account)) {
      throw new BilibiliSessionChangedError();
    }
  }

  assertCurrent();
  if (!/^[1-9]\d*$/.test(change.dynamicId)) {
    throw new Error("动态 ID 无效，请刷新后重试");
  }

  const cookie = await dependencies.readCookie();
  assertCurrent();
  if (!cookie || !hasBilibiliLoginCookie(cookie)) {
    throw new DynamicLikeLoginRequiredError("请先登录 B站");
  }
  if (getBilibiliUserId(cookie) !== account.mid) {
    throw new BilibiliSessionChangedError();
  }
  const csrf = getBilibiliCsrf(cookie);
  if (!csrf) {
    throw new DynamicLikeLoginRequiredError("登录凭据缺少 CSRF，请重新登录 B站");
  }

  const url = `https://api.bilibili.com/x/dynamic/feed/dyn/thumb?csrf=${encodeURIComponent(csrf)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let receivedResult = false;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: createBilibiliRequestHeaders(
        url,
        {
          accept: "application/json",
          "content-type": "application/json",
          "user-agent": UA,
          origin: "https://www.bilibili.com",
          referer: `https://www.bilibili.com/opus/${encodeURIComponent(change.dynamicId)}`,
        },
        cookie,
      ),
      credentials: "omit",
      body: JSON.stringify({ dyn_id_str: change.dynamicId, up: change.liked ? 1 : 2 }),
      signal: controller.signal,
    });
    assertCurrent();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const parsed = DynamicLikeResponseSchema.safeParse(await response.json());
    assertCurrent();
    if (!parsed.success) {
      throw new Error("动态点赞响应格式异常");
    }
    const { code, message } = parsed.data;
    receivedResult = true;
    if (isBilibiliAuthExpiredCode(code)) {
      throw reportBilibiliAuthExpired(code, message, url);
    }
    if (code !== 0) {
      throw new Error(`动态点赞操作失败（${code}）：${message || "请稍后重试"}`);
    }
    return change;
  } catch (error) {
    assertCurrent();
    if (!receivedResult) {
      throw new DynamicLikeResultUnknownError(
        controller.signal.aborted
          ? "动态点赞操作超时，请刷新后确认最新状态"
          : "无法确认动态点赞结果，请刷新后重试",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
