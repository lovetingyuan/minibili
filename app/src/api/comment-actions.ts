import { UA } from "../constants";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  isBilibiliAuthExpiredCode,
  reportBilibiliAuthExpired,
} from "../features/bilibili-session/auth-expiration";
import { LoginRequiredError } from "../features/bilibili-session/login-required";
import type { BilibiliAccount } from "../features/bilibili-session/types";

import {
  createBilibiliRequestHeaders,
  getBilibiliCsrf,
  getBilibiliUserId,
  hasBilibiliLoginCookie,
  isBilibiliUrl,
} from "./bilibili-cookie.helpers";
import {
  AddCommentReplyResponseSchema,
  CommentActionResponseSchema,
} from "./comment-actions.schema";
import { stringifyCommentOid } from "./comment-json.helpers";
import type {
  AddCommentInput,
  AddCommentReplyInput,
  CommentAttitudeChange,
  CommentDeleteChange,
  CommentPostRequestOptions,
  CommentRequestDependencies,
} from "./comment-actions.types";
import { getReplyItem } from "./comments";

export class CommentLoginRequiredError extends LoginRequiredError {}
export class CommentResultUnknownError extends Error {}

function validatePositiveInteger(value: string | number, label: string) {
  const text = String(value);
  if (!/^[1-9]\d*$/.test(text) || !Number.isSafeInteger(Number(text))) {
    throw new Error(`${label}无效，请重新打开评论`);
  }
  return text;
}

/**
 * oid（动态 ID）和 rpid 都是 B 站的 64 位整数，动态 ID 目前有 19 位，
 * 用 Number.isSafeInteger 校验会把合法 ID 判成无效，所以只按十进制字符串校验。
 * 传进来的 number 超出安全整数范围时说明上游解析已经丢过精度，只能报错让页面重开。
 */
function validateCommentId(value: string | number, label: string) {
  if (typeof value === "number" && !Number.isSafeInteger(value)) {
    throw new Error(`${label}无效，请重新打开评论`);
  }
  const text = String(value);
  if (!/^[1-9]\d{0,18}$/.test(text)) {
    throw new Error(`${label}无效，请重新打开评论`);
  }
  return text;
}

function validateCommentMessage(value: string, actionName: string) {
  const message = value.trim();
  const length = [...message].length;
  if (!length) {
    throw new Error(`请输入${actionName}内容`);
  }
  if (length > 1000) {
    throw new Error(`${actionName}不能超过 1000 个字符`);
  }
  return message;
}

async function getCredentials(account: BilibiliAccount, dependencies: CommentRequestDependencies) {
  if (!dependencies.isCurrentAccount(account)) {
    throw new BilibiliSessionChangedError();
  }
  const cookie = await dependencies.readCookie();
  if (!dependencies.isCurrentAccount(account)) {
    throw new BilibiliSessionChangedError();
  }
  if (!cookie || !hasBilibiliLoginCookie(cookie)) {
    throw new CommentLoginRequiredError("请先登录 B站");
  }
  if (getBilibiliUserId(cookie) !== account.mid) {
    throw new BilibiliSessionChangedError();
  }
  const csrf = getBilibiliCsrf(cookie);
  if (!csrf) {
    throw new CommentLoginRequiredError("登录凭据缺少 CSRF，请重新登录 B站");
  }
  return { cookie, csrf };
}

async function postCommentRequest<T>(options: CommentPostRequestOptions<T>) {
  const { account, dependencies, url, sourceUrl, body, parse, actionName } = options;
  const { cookie, csrf } = await getCredentials(account, dependencies);
  body.set("csrf", csrf);
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
          "content-type": "application/x-www-form-urlencoded",
          "user-agent": UA,
          origin: "https://www.bilibili.com",
          referer: sourceUrl,
        },
        cookie,
      ),
      credentials: "omit",
      body: body.toString(),
      signal: controller.signal,
    });
    if (!dependencies.isCurrentAccount(account)) {
      throw new BilibiliSessionChangedError();
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const parsed = parse(JSON.parse(stringifyCommentOid(await response.text())));
    if (!dependencies.isCurrentAccount(account)) {
      throw new BilibiliSessionChangedError();
    }
    receivedResult = true;
    return parsed;
  } catch (error) {
    if (!dependencies.isCurrentAccount(account)) {
      throw new BilibiliSessionChangedError();
    }
    if (!receivedResult) {
      throw new CommentResultUnknownError(
        controller.signal.aborted
          ? `${actionName}超时，正在确认最新状态`
          : `无法确认${actionName}结果，正在刷新评论`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function assertBusinessResult(result: { code: number; message?: string }, actionName: string) {
  if (isBilibiliAuthExpiredCode(result.code)) {
    throw reportBilibiliAuthExpired(result.code, result.message);
  }
  if (result.code !== 0) {
    throw new Error(`${actionName}失败（${result.code}）：${result.message || "请稍后重试"}`);
  }
}

export async function modifyCommentAttitude(
  account: BilibiliAccount,
  change: CommentAttitudeChange,
  dependencies: CommentRequestDependencies,
) {
  const oid = validateCommentId(change.target.oid, "评论来源 ID");
  const rpid = validateCommentId(change.target.id, "评论 ID");
  const type = validatePositiveInteger(change.target.type, "评论类型");
  if (!isBilibiliUrl(change.sourceUrl)) {
    throw new Error("评论来源地址无效");
  }
  const url = `https://api.bilibili.com/x/v2/reply/${change.kind === "like" ? "action" : "hate"}`;
  const result = await postCommentRequest({
    account,
    dependencies,
    url,
    sourceUrl: change.sourceUrl,
    body: new URLSearchParams({
      oid,
      type,
      rpid,
      action: change.active ? "1" : "0",
      statistics: JSON.stringify({ appId: 100, platform: 5 }),
    }),
    actionName: change.kind === "like" ? "点赞" : "点踩",
    parse(payload) {
      const parsed = CommentActionResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error("评论操作响应格式异常");
      }
      return parsed.data;
    },
  });
  assertBusinessResult(result, change.kind === "like" ? "点赞" : "点踩");
  return change;
}

/**
 * 删除评论：只传 oid/type/rpid（csrf 由 postCommentRequest 注入），
 * 与 B 站线上评论组件的删除请求一致。
 */
export async function deleteComment(
  account: BilibiliAccount,
  change: CommentDeleteChange,
  dependencies: CommentRequestDependencies,
) {
  const oid = validateCommentId(change.target.oid, "评论来源 ID");
  const rpid = validateCommentId(change.target.id, "评论 ID");
  const type = validatePositiveInteger(change.target.type, "评论类型");
  if (!isBilibiliUrl(change.sourceUrl)) {
    throw new Error("评论来源地址无效");
  }
  const result = await postCommentRequest({
    account,
    dependencies,
    url: "https://api.bilibili.com/x/v2/reply/del",
    sourceUrl: change.sourceUrl,
    body: new URLSearchParams({ oid, type, rpid }),
    actionName: "删除评论",
    parse(payload) {
      const parsed = CommentActionResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error("删除评论响应格式异常");
      }
      return parsed.data;
    },
  });
  assertBusinessResult(result, "删除评论");
  return change.target;
}

type AddedCommentPayload = {
  oid: string;
  type: string;
  message: string;
  sourceUrl: string;
  root?: string;
  parent?: string;
};

/**
 * 发表评论与回复共用同一个接口：顶层评论不带 root/parent，子回复才带。
 * 参数与 B 站线上评论组件（bili-comments）一致。
 */
async function postAddedComment(
  account: BilibiliAccount,
  payload: AddedCommentPayload,
  dependencies: CommentRequestDependencies,
  actionName: "评论" | "回复",
) {
  const body = new URLSearchParams({
    plat: "1",
    oid: payload.oid,
    type: payload.type,
    message: payload.message,
  });
  if (payload.root) {
    body.set("root", payload.root);
    body.set("parent", payload.parent ?? payload.root);
  }
  body.set("at_name_to_mid", "{}");
  body.set("gaia_source", "main_web");
  body.set("statistics", JSON.stringify({ appId: 100, platform: 5 }));
  const result = await postCommentRequest({
    account,
    dependencies,
    url: "https://api.bilibili.com/x/v2/reply/add",
    sourceUrl: payload.sourceUrl,
    body,
    actionName,
    parse(response) {
      const parsed = AddCommentReplyResponseSchema.safeParse(response);
      if (!parsed.success) {
        throw new Error(`${actionName}响应格式异常`);
      }
      return parsed.data;
    },
  });
  assertBusinessResult(result, actionName);
  if (!result.data?.reply) {
    throw new CommentResultUnknownError(`${actionName}已提交，正在刷新评论`);
  }
  return getReplyItem(result.data.reply, Number(payload.type));
}

export async function addComment(
  account: BilibiliAccount,
  input: AddCommentInput,
  dependencies: CommentRequestDependencies,
) {
  const message = validateCommentMessage(input.message, "评论");
  const oid = validateCommentId(input.oid, "评论来源 ID");
  const type = validatePositiveInteger(input.type, "评论类型");
  if (!isBilibiliUrl(input.sourceUrl)) {
    throw new Error("评论来源地址无效");
  }
  return postAddedComment(
    account,
    { oid, type, message, sourceUrl: input.sourceUrl },
    dependencies,
    "评论",
  );
}

export async function addCommentReply(
  account: BilibiliAccount,
  input: AddCommentReplyInput,
  dependencies: CommentRequestDependencies,
) {
  const message = validateCommentMessage(input.message, "回复");
  const oid = validateCommentId(input.target.oid, "评论来源 ID");
  const rpid = validateCommentId(input.target.id, "评论 ID");
  const type = validatePositiveInteger(input.target.type, "评论类型");
  if (!isBilibiliUrl(input.sourceUrl)) {
    throw new Error("评论来源地址无效");
  }
  const root =
    String(input.target.root) === "0" ? rpid : validateCommentId(input.target.root, "根评论 ID");
  return postAddedComment(
    account,
    { oid, type, message, sourceUrl: input.sourceUrl, root, parent: rpid },
    dependencies,
    "回复",
  );
}
