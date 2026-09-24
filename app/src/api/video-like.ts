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
import type { FavoriteAccount } from "./favorites.types";
import { VideoLikeResponseSchema } from "./video-like.schema";
import type { VideoLikeChange, VideoLikeRequestDependencies } from "./video-like.types";

export class VideoLikeLoginRequiredError extends LoginRequiredError {}
export class VideoLikeResultUnknownError extends Error {}

export async function modifyVideoLike(
  account: FavoriteAccount,
  change: VideoLikeChange,
  dependencies: VideoLikeRequestDependencies,
) {
  function assertCurrent() {
    if (!dependencies.isCurrentAccount(account)) {
      throw new BilibiliSessionChangedError();
    }
  }
  assertCurrent();
  const { video, liked } = change;
  if (!/^[1-9]\d*$/.test(video.aid) || !Number.isSafeInteger(Number(video.aid)) || !video.bvid) {
    throw new Error("视频 ID 无效，请重新打开视频");
  }
  const cookie = await dependencies.readCookie();
  assertCurrent();
  if (!cookie || !hasBilibiliLoginCookie(cookie)) {
    throw new VideoLikeLoginRequiredError("请先登录 B站");
  }
  if (getBilibiliUserId(cookie) !== account.mid) {
    throw new BilibiliSessionChangedError();
  }
  const csrf = getBilibiliCsrf(cookie);
  if (!csrf) {
    throw new VideoLikeLoginRequiredError("登录凭据缺少 CSRF，请重新登录 B站");
  }
  const url = "https://api.bilibili.com/x/web-interface/archive/like";
  const body = new URLSearchParams({
    aid: video.aid,
    like: liked ? "1" : "2",
    from_spmid: "333.1007.tianma.2-1-3.click",
    spmid: "333.788.0.0",
    statistics: JSON.stringify({ appId: 100, platform: 5 }),
    eab_x: "2",
    ramval: "159",
    source: "web_normal",
    ga: "1",
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
          referer: `https://www.bilibili.com/video/${encodeURIComponent(video.bvid)}/`,
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
    const parsed = VideoLikeResponseSchema.safeParse(await response.json());
    assertCurrent();
    if (!parsed.success) {
      throw new Error("点赞响应格式异常");
    }
    const { code, message } = parsed.data;
    receivedResult = true;
    if (isBilibiliAuthExpiredCode(code)) {
      throw reportBilibiliAuthExpired(code, message, url);
    }
    if (code === 65004 || code === 65006) {
      throw new VideoLikeResultUnknownError("点赞状态已变化，请刷新后再操作");
    }
    if (code !== 0) {
      throw new Error(`点赞操作失败（${code}）：${message || "请稍后重试"}`);
    }
    return change;
  } catch (error) {
    assertCurrent();
    if (!receivedResult) {
      throw new VideoLikeResultUnknownError(
        controller.signal.aborted
          ? "点赞操作超时，请确认最新点赞状态后再操作"
          : "无法确认点赞结果，请刷新状态后再操作",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
