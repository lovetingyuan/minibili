import { UA } from "../constants";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
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

export class RelationLoginRequiredError extends Error {}

export async function modifyBilibiliRelation(
  account: RelationAccount,
  change: RelationChange,
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
  const query = new URLSearchParams({
    statistics: JSON.stringify({ appId: 100, platform: 5 }),
    "x-bili-device-req-json": JSON.stringify({ platform: "web", device: "pc", spmid: "333.1387" }),
  });
  const url = "https://api.bilibili.com/x/relation/modify?" + query.toString();
  const body = new URLSearchParams({
    fid,
    act: change.act.toString(),
    re_src: "11",
    gaia_source: "web_main",
    spmid: "333.1387",
    extend_content: JSON.stringify({ entity: "user", entity_id: Number(fid) }),
    is_from_frontend_component: "true",
    csrf,
  });
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
      throw new Error("关注操作失败（HTTP " + response.status + "）");
    }
    const parsed = ModifyRelationResponseSchema.safeParse(await response.json());
    assertCurrent();
    if (!parsed.success) {
      throw new Error("关注操作响应格式异常，请刷新关注列表确认结果");
    }
    const { code, message } = parsed.data;
    if (code === -101 || code === -111) {
      throw new RelationLoginRequiredError("登录凭据失效，请重新登录 B站");
    }
    if (code !== 0) {
      throw new Error("关注操作失败（" + code + "）：" + (message || "请稍后重试"));
    }
    return change;
  } catch (error) {
    assertCurrent();
    if (controller.signal.aborted) {
      throw new Error("关注操作超时，请刷新关注列表确认结果后再操作");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
