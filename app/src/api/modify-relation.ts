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
import { ModifyRelationResponseSchema } from "./modify-relation.schema";
import type {
  RelationAccount,
  RelationChange,
  RelationRequestDependencies,
} from "./modify-relation.types";

export class RelationLoginRequiredError extends LoginRequiredError {}

export async function modifyBilibiliRelation<T extends RelationChange>(
  account: RelationAccount,
  change: T,
  dependencies: RelationRequestDependencies,
) {
  const assertCurrent = () => {
    if (!dependencies.isCurrentAccount(account)) {
      throw new BilibiliSessionChangedError();
    }
  };
  assertCurrent();
  const cookie = await dependencies.readCookie();
  assertCurrent();
  if (!cookie || !hasBilibiliLoginCookie(cookie)) {
    throw new RelationLoginRequiredError("请先登录 B站");
  }
  if (getBilibiliUserId(cookie) !== account.mid) {
    throw new BilibiliSessionChangedError();
  }
  const csrf = getBilibiliCsrf(cookie);
  if (!csrf) {
    throw new RelationLoginRequiredError("登录凭据缺少 CSRF，请重新登录 B站");
  }
  const fid = change.up.mid.toString();
  if (!/^[1-9]\d*$/.test(fid) || !Number.isSafeInteger(Number(fid))) {
    throw new Error("UP 主 ID 无效");
  }
  const isBlock = change.act === 5;
  const operation = isBlock ? "拉黑" : "关注";
  const confirmResult = isBlock ? "请先到 B站黑名单确认结果" : "请刷新关注列表确认结果";
  const query = new URLSearchParams({
    statistics: JSON.stringify({ appId: 100, platform: 5 }),
  });
  if (!isBlock) {
    query.set(
      "x-bili-device-req-json",
      JSON.stringify({ platform: "web", device: "pc", spmid: "333.1387" }),
    );
  }
  const url = "https://api.bilibili.com/x/relation/modify?" + query.toString();
  const body = new URLSearchParams({
    fid,
    act: change.act.toString(),
    re_src: "11",
    gaia_source: "web_main",
    spmid: isBlock ? "333.1387.0.0" : "333.1387",
    extend_content: JSON.stringify({ entity: "user", entity_id: Number(fid) }),
    csrf,
  });
  if (!isBlock) {
    body.set("is_from_frontend_component", "true");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: createBilibiliRequestHeaders(
        url,
        {
          accept: "application/json",
          "content-type": "application/x-www-form-urlencoded",
          "user-agent": UA,
          origin: "https://space.bilibili.com",
          referer: "https://space.bilibili.com/" + fid,
        },
        cookie,
      ),
      body: body.toString(),
      credentials: "omit",
      signal: controller.signal,
    });
    assertCurrent();
    if (!response.ok) {
      throw new Error(operation + "操作失败（HTTP " + response.status + "）");
    }
    const parsed = ModifyRelationResponseSchema.safeParse(await response.json());
    assertCurrent();
    if (!parsed.success) {
      throw new Error(operation + "操作响应格式异常，" + confirmResult);
    }
    const { code, message } = parsed.data;
    if (isBilibiliAuthExpiredCode(code)) {
      throw reportBilibiliAuthExpired(code, message, url);
    }
    if (code !== 0) {
      throw new Error(operation + "操作失败（" + code + "）：" + (message || "请稍后重试"));
    }
    return change;
  } catch (error) {
    assertCurrent();
    if (controller.signal.aborted) {
      throw new Error(operation + "操作超时，" + confirmResult + "后再操作");
    }
    if (error instanceof SyntaxError) {
      throw new Error(operation + "操作响应格式异常，" + confirmResult);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
