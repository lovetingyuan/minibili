import { UA } from "../constants";
import {
  BilibiliAuthExpiredError,
  isBilibiliAuthExpiredCode,
  reportBilibiliAuthExpired,
} from "../features/bilibili-session/auth-expiration";
import { LoginRequiredError } from "../features/bilibili-session/login-required";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { getProgressRatio } from "../utils/watch-progress";
import {
  createBilibiliRequestHeaders,
  getBilibiliCsrf,
  getBilibiliUserId,
  hasBilibiliLoginCookie,
} from "./bilibili-cookie.helpers";
import { WatchLaterActionResponseSchema, WatchLaterResponseSchema } from "./watch-later.schema";
import type {
  WatchLaterAccount,
  WatchLaterChange,
  WatchLaterKey,
  WatchLaterListItem,
  WatchLaterRequest,
  WatchLaterRequestDependencies,
  WatchLaterResponse,
} from "./watch-later.types";

export class WatchLaterLoginRequiredError extends LoginRequiredError {}
export class WatchLaterResultUnknownError extends Error {}

const WATCH_LATER_LIST_URL = "/x/v2/history/toview/web?web_location=333.1007";
const WATCH_LATER_REQUEST_TIMEOUT = 15000;

export function getWatchLaterKey(account: WatchLaterAccount): WatchLaterKey {
  return ["bilibili-watch-later", account.mid, account.generation];
}

function getLoginRequiredCode(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof error.code === "number" &&
    isBilibiliAuthExpiredCode(error.code)
      ? error.code
      : null
  );
}

function assertCurrentAccount(isCurrentAccount: () => boolean) {
  if (!isCurrentAccount()) {
    throw new BilibiliSessionChangedError();
  }
}

function assertVideoAid(aid: string) {
  if (!/^[1-9]\d*$/.test(aid) || !Number.isSafeInteger(Number(aid))) {
    throw new Error("视频 ID 无效，请重新打开视频");
  }
}

export function getWatchLaterListItems(
  response: WatchLaterResponse | null | undefined,
): WatchLaterListItem[] {
  const seen = new Set<string>();
  const items: WatchLaterListItem[] = [];
  for (const record of response?.list ?? []) {
    const aid = String(record.aid);
    if (seen.has(aid)) {
      continue;
    }
    seen.add(aid);
    const bvid = record.bvid?.trim();
    const title = record.title || "不可用的视频";
    const duration = record.duration ?? 0;
    const progress = record.progress ?? 0;
    items.push({
      key: aid,
      aid,
      title,
      progressRatio: getProgressRatio(progress, duration, record.viewed === true),
      video: bvid
        ? {
            bvid,
            aid,
            title,
            cover: record.pic ?? "",
            duration,
            mid: record.owner?.mid ?? 0,
            name: record.owner?.name || "未知UP主",
            face: record.owner?.face ?? "",
            play: record.stat?.view ?? undefined,
            danmaku: record.stat?.danmaku ?? undefined,
          }
        : null,
    });
  }
  return items;
}

export async function fetchBilibiliWatchLater(
  _account: WatchLaterAccount,
  request: WatchLaterRequest,
  isCurrentAccount: () => boolean,
): Promise<WatchLaterResponse> {
  assertCurrentAccount(isCurrentAccount);
  try {
    const data = await request(WATCH_LATER_LIST_URL);
    assertCurrentAccount(isCurrentAccount);
    return WatchLaterResponseSchema.parse(data);
  } catch (error) {
    assertCurrentAccount(isCurrentAccount);
    if (error instanceof BilibiliAuthExpiredError) {
      throw error;
    }
    const code = getLoginRequiredCode(error);
    if (code) {
      throw reportBilibiliAuthExpired(code, error instanceof Error ? error.message : undefined, WATCH_LATER_LIST_URL);
    }
    throw error;
  }
}

export async function modifyWatchLater(
  account: WatchLaterAccount,
  change: WatchLaterChange,
  dependencies: WatchLaterRequestDependencies,
) {
  function assertCurrent() {
    assertCurrentAccount(() => dependencies.isCurrentAccount(account));
  }
  assertCurrent();
  assertVideoAid(change.aid);
  const cookie = await dependencies.readCookie();
  assertCurrent();
  if (!cookie || !hasBilibiliLoginCookie(cookie)) {
    throw new WatchLaterLoginRequiredError("请先登录 B站");
  }
  if (getBilibiliUserId(cookie) !== account.mid) {
    throw new BilibiliSessionChangedError();
  }
  const csrf = getBilibiliCsrf(cookie);
  if (!csrf) {
    throw new WatchLaterLoginRequiredError("登录凭据缺少 CSRF，请重新登录 B站");
  }
  const actionName = change.added ? "添加稍后再看" : "移除稍后再看";
  const url = `https://api.bilibili.com/x/v2/history/toview/${change.added ? "add" : "del"}`;
  const body = new URLSearchParams({ aid: change.aid, csrf });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WATCH_LATER_REQUEST_TIMEOUT);
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
          referer: "https://www.bilibili.com/",
        },
        cookie,
      ),
      credentials: "omit",
      body: body.toString(),
      signal: controller.signal,
    });
    assertCurrent();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const parsed = WatchLaterActionResponseSchema.safeParse(await response.json());
    assertCurrent();
    if (!parsed.success) {
      throw new Error("响应格式异常");
    }
    receivedResult = true;
    const { code, message } = parsed.data;
    if (isBilibiliAuthExpiredCode(code)) {
      throw reportBilibiliAuthExpired(code, message, url);
    }
    if (code !== 0) {
      throw new Error(`${actionName}失败（${code}）：${message || "请稍后重试"}`);
    }
    return change;
  } catch (error) {
    assertCurrent();
    if (!receivedResult) {
      throw new WatchLaterResultUnknownError(
        controller.signal.aborted
          ? `${actionName}超时，请刷新稍后再看确认结果后再操作`
          : `无法确认${actionName}结果，请刷新稍后再看后再操作`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
