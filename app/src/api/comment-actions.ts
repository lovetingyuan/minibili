import { UA } from "../constants";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
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
import type {
  AddCommentReplyInput,
  CommentAttitudeChange,
  CommentPostRequestOptions,
  CommentRequestDependencies,
} from "./comment-actions.types";
import { getReplyItem } from "./comments";

export class CommentLoginRequiredError extends Error {}
export class CommentResultUnknownError extends Error {}

function validatePositiveInteger(value: string | number, label: string) {
  const text = String(value);
  if (!/^[1-9]\d*$/.test(text) || !Number.isSafeInteger(Number(text))) {
    throw new Error(`${label}无效，请重新打开评论`);
  }
  return text;
}

async function getCredentials(account: BilibiliAccount, dependencies: CommentRequestDependencies) {
  if (!dependencies.isCurrentAccount(account)) throw new BilibiliSessionChangedError();
  const cookie = await dependencies.readCookie();
  if (!dependencies.isCurrentAccount(account)) throw new BilibiliSessionChangedError();
  if (!cookie || !hasBilibiliLoginCookie(cookie)) {
    throw new CommentLoginRequiredError("请先登录 B站");
  }
  if (getBilibiliUserId(cookie) !== account.mid) throw new BilibiliSessionChangedError();
  const csrf = getBilibiliCsrf(cookie);
  if (!csrf) throw new CommentLoginRequiredError("登录凭据缺少 CSRF，请重新登录 B站");
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
    if (!dependencies.isCurrentAccount(account)) throw new BilibiliSessionChangedError();
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = parse(await response.json());
    if (!dependencies.isCurrentAccount(account)) throw new BilibiliSessionChangedError();
    receivedResult = true;
    return parsed;
  } catch (error) {
    if (!dependencies.isCurrentAccount(account)) throw new BilibiliSessionChangedError();
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
  if (result.code === -101 || result.code === -111) {
    throw new CommentLoginRequiredError("登录凭据失效，请重新登录 B站");
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
  const oid = validatePositiveInteger(change.target.oid, "评论来源 ID");
  const rpid = validatePositiveInteger(change.target.id, "评论 ID");
  const type = validatePositiveInteger(change.target.type, "评论类型");
  if (!isBilibiliUrl(change.sourceUrl)) throw new Error("评论来源地址无效");
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
      if (!parsed.success) throw new Error("评论操作响应格式异常");
      return parsed.data;
    },
  });
  assertBusinessResult(result, change.kind === "like" ? "点赞" : "点踩");
  return change;
}

export async function addCommentReply(
  account: BilibiliAccount,
  input: AddCommentReplyInput,
  dependencies: CommentRequestDependencies,
) {
  const message = input.message.trim();
  const length = [...message].length;
  if (!length) throw new Error("请输入回复内容");
  if (length > 1000) throw new Error("回复不能超过 1000 个字符");
  const oid = validatePositiveInteger(input.target.oid, "评论来源 ID");
  const rpid = validatePositiveInteger(input.target.id, "评论 ID");
  const type = validatePositiveInteger(input.target.type, "评论类型");
  if (!isBilibiliUrl(input.sourceUrl)) throw new Error("评论来源地址无效");
  const root =
    String(input.target.root) === "0"
      ? rpid
      : validatePositiveInteger(input.target.root, "根评论 ID");
  const result = await postCommentRequest({
    account,
    dependencies,
    url: "https://api.bilibili.com/x/v2/reply/add",
    sourceUrl: input.sourceUrl,
    body: new URLSearchParams({
      plat: "1",
      oid,
      type,
      message,
      root,
      parent: rpid,
      at_name_to_mid: "{}",
      gaia_source: "main_web",
      statistics: JSON.stringify({ appId: 100, platform: 5 }),
    }),
    actionName: "回复",
    parse(payload) {
      const parsed = AddCommentReplyResponseSchema.safeParse(payload);
      if (!parsed.success) throw new Error("回复响应格式异常");
      return parsed.data;
    },
  });
  assertBusinessResult(result, "回复");
  if (!result.data?.reply) {
    throw new CommentResultUnknownError("回复已提交，正在刷新评论");
  }
  return getReplyItem(result.data.reply, input.target.type);
}
