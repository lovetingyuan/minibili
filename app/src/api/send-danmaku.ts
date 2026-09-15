import { UA } from "../constants";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  createBilibiliRequestHeaders,
  getBilibiliCsrf,
  getBilibiliUserId,
  hasBilibiliLoginCookie,
} from "./bilibili-cookie.helpers";
import type { FavoriteAccount } from "./favorites.types";
import { DANMAKU_SEND_ERROR_MESSAGES } from "./send-danmaku.errors";
import { DanmakuSendResponseSchema } from "./send-danmaku.schema";
import type {
  DanmakuSendRequest,
  DanmakuSendRequestDependencies,
  DanmakuSendResult,
} from "./send-danmaku.types";

export class DanmakuLoginRequiredError extends Error {}
export class DanmakuSendResultUnknownError extends Error {}

/**
 * 弹幕内容上限：滚动弹幕超过 100 字符会被服务端拒绝（-641）
 */
export const DANMAKU_MAX_LENGTH = 100;

/**
 * 固定使用 B站网页播放器的默认滚动弹幕样式
 */
export const DANMAKU_SEND_STYLE = {
  type: "1",
  mode: "1",
  color: "16777215",
  fontsize: "25",
  pool: "0",
  plat: "1",
  checkboxType: "0",
  gaiasource: "main_web",
} as const;

/**
 * 检查弹幕文本是否可以发送，返回去除首尾空白后的内容
 */
export function resolveDanmakuText(text: string) {
  const normalized = text.trim();
  if (!normalized) throw new Error("请输入弹幕内容");
  if (/[\r\n]/.test(normalized)) throw new Error("弹幕内容不能包含换行");
  if ([...normalized].length > DANMAKU_MAX_LENGTH)
    throw new Error(`弹幕内容不能超过 ${DANMAKU_MAX_LENGTH} 个字符`);
  return normalized;
}

function assertVideo(request: DanmakuSendRequest) {
  if (
    !/^[1-9]\d*$/.test(request.video.aid) ||
    !Number.isSafeInteger(Number(request.video.aid)) ||
    !request.video.bvid
  ) {
    throw new Error("视频 ID 无效，请重新打开视频");
  }
  if (!Number.isSafeInteger(request.cid) || request.cid <= 0) {
    throw new Error("分P 信息无效，请重新打开视频");
  }
  if (!Number.isFinite(request.progressMs) || request.progressMs < 0) {
    throw new Error("播放进度无效，请重新发送弹幕");
  }
}

export async function sendVideoDanmaku(
  account: FavoriteAccount,
  request: DanmakuSendRequest,
  dependencies: DanmakuSendRequestDependencies,
): Promise<DanmakuSendResult> {
  function assertCurrent() {
    if (!dependencies.isCurrentAccount(account)) throw new BilibiliSessionChangedError();
  }
  assertCurrent();
  assertVideo(request);
  const text = resolveDanmakuText(request.text);
  const progressMs = Math.ceil(request.progressMs);
  const cookie = await dependencies.readCookie();
  assertCurrent();
  if (!cookie || !hasBilibiliLoginCookie(cookie))
    throw new DanmakuLoginRequiredError("请先登录 B站");
  if (getBilibiliUserId(cookie) !== account.mid) throw new BilibiliSessionChangedError();
  const csrf = getBilibiliCsrf(cookie);
  if (!csrf) throw new DanmakuLoginRequiredError("登录凭据缺少 CSRF，请重新登录 B站");
  const url = "https://api.bilibili.com/x/v2/dm/post";
  const body = new URLSearchParams({
    type: DANMAKU_SEND_STYLE.type,
    oid: String(request.cid),
    msg: text,
    aid: request.video.aid,
    progress: String(progressMs),
    rnd: String(Date.now()),
    plat: DANMAKU_SEND_STYLE.plat,
    color: DANMAKU_SEND_STYLE.color,
    fontsize: DANMAKU_SEND_STYLE.fontsize,
    pool: DANMAKU_SEND_STYLE.pool,
    mode: DANMAKU_SEND_STYLE.mode,
    checkbox_type: DANMAKU_SEND_STYLE.checkboxType,
    gaiasource: DANMAKU_SEND_STYLE.gaiasource,
    spmid: "333.788.0.0",
    from_spmid: "333.1007.tianma.2-1-3.click",
    statistics: JSON.stringify({ appId: 100, platform: 5 }),
    csrf,
  });
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
          referer: `https://www.bilibili.com/video/${encodeURIComponent(request.video.bvid)}/`,
        },
        cookie,
      ),
      credentials: "omit",
      body: body.toString(),
      signal: controller.signal,
    });
    assertCurrent();
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = DanmakuSendResponseSchema.safeParse(await response.json());
    assertCurrent();
    if (!parsed.success) throw new Error("发送弹幕响应格式异常");
    const { code, message, data } = parsed.data;
    receivedResult = true;
    // 登录态不可用：-101 未登录、-111 CSRF 校验失败、-8 禁止游客弹幕
    if (code === -8 || code === -101 || code === -111)
      throw new DanmakuLoginRequiredError("登录凭据失效，请重新登录 B站");
    if (code !== 0) {
      const known = DANMAKU_SEND_ERROR_MESSAGES[code];
      throw new Error(known ?? `弹幕发送失败（${code}）：${message || "请稍后重试"}`);
    }
    const dmid = data?.dmid_str;
    if (dmid === undefined || `${dmid}`.length === 0)
      throw new Error(message || "弹幕发送失败，请稍后重试");
    return { dmid: `${dmid}`, text, progressMs };
  } catch (error) {
    assertCurrent();
    if (!receivedResult) {
      throw new DanmakuSendResultUnknownError(
        controller.signal.aborted
          ? "发送弹幕超时，请稍后在视频中确认是否已发送"
          : "无法确认弹幕是否发送成功，请稍后在视频中确认",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
