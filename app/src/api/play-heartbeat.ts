import { UA } from "../constants";
import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { bilibiliSession } from "../features/bilibili-session/session";
import encWbi from "../utils/wbi";
import {
  createBilibiliRequestHeaders,
  getBilibiliCsrf,
  getBilibiliUserId,
  hasBilibiliLoginCookie,
} from "./bilibili-cookie.helpers";
import fetcher from "./fetcher";
import { getBilibiliLoginCookie } from "./get-cookie";
import { PlayHeartbeatResponseSchema } from "./play-heartbeat.schema";
import type {
  PlayHeartbeatAccount,
  PlayHeartbeatReport,
  PlayHeartbeatRequestDependencies,
  PlayHeartbeatSession,
  PlayHeartbeatType,
  PlayHeartbeatVideo,
} from "./play-heartbeat.types";
import { getWBIInfo } from "./user-nav";

const PLAY_START_URL = "https://api.bilibili.com/x/click-interface/click/web/h5";
const HEARTBEAT_URL = "https://api.bilibili.com/x/click-interface/web/heartbeat";
/** 网页端上报使用的页面标识，B站按固定值校验播放来源 */
const WEB_LOCATION = "1315873";
const SPMID = "333.788.0.0";
/** dt：设备类型，网页端固定 2 */
const DEVICE_TYPE = 2;
/** 视频稿件类型 */
const VIDEO_TYPE = 3;
const SESSION_ID_LENGTH = 32;
export const PLAY_HEARTBEAT_TIMEOUT_MS = 10000;

/** 1 开始播放 / 0 定时上报 / 2 暂停 / 3 继续播放 / 4 播放结束 */
export const PLAY_HEARTBEAT_TYPES = {
  periodic: 0,
  start: 1,
  pause: 2,
  resume: 3,
  end: 4,
} as const satisfies Record<string, PlayHeartbeatType>;

export class PlayHeartbeatLoginRequiredError extends Error {}

function randomHex(length: number) {
  let result = "";
  while (result.length < length) {
    result += Math.floor(Math.random() * 16).toString(16);
  }
  return result;
}

/** 新建一次播放会话；`playedTime` 是播放开始时的位置，续播时不为 0 */
export function createPlayHeartbeatSession(
  nowMs = Date.now(),
  playedTime = 0,
): PlayHeartbeatSession {
  return {
    session: randomHex(SESSION_ID_LENGTH),
    startTs: Math.floor(nowMs / 1000),
    maxPlayedTime: Math.max(0, Math.round(playedTime)),
  };
}

function createStatistics() {
  return JSON.stringify({ appId: 100, platform: 5 });
}

/** 播放器内部统计字段取不到，只上报已知的播放方式 */
function createExtra() {
  return JSON.stringify({ play_method: 2 });
}

function createReferer(bvid: string) {
  return `https://www.bilibili.com/video/${encodeURIComponent(bvid)}/`;
}

/**
 * 上报前重新取一次 Cookie，确认账号没有在播放期间被切换或退出；
 * B站的写接口都要求 Cookie 里的 mid 与 csrf 同时有效。
 */
async function resolveCredentials(
  account: PlayHeartbeatAccount,
  dependencies: PlayHeartbeatRequestDependencies,
) {
  function assertCurrent() {
    if (!dependencies.isCurrentAccount(account)) {
      throw new BilibiliSessionChangedError();
    }
  }
  assertCurrent();
  const cookie = await dependencies.readCookie();
  assertCurrent();
  if (!cookie || !hasBilibiliLoginCookie(cookie)) {
    throw new PlayHeartbeatLoginRequiredError("请先登录 B站");
  }
  if (getBilibiliUserId(cookie) !== account.mid) {
    throw new BilibiliSessionChangedError();
  }
  const csrf = getBilibiliCsrf(cookie);
  if (!csrf) {
    throw new PlayHeartbeatLoginRequiredError("登录凭据缺少 CSRF，请重新登录 B站");
  }
  return { cookie, csrf, mid: account.mid };
}

async function postPlayReport(url: string, body: URLSearchParams, cookie: string, referer: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLAY_HEARTBEAT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: createBilibiliRequestHeaders(
        url,
        {
          accept: "application/json, text/plain, */*",
          "content-type": "application/x-www-form-urlencoded",
          "user-agent": UA,
          origin: "https://www.bilibili.com",
          referer,
        },
        cookie,
      ),
      credentials: "omit",
      body: body.toString(),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`播放进度上报失败（HTTP ${response.status}）`);
    }
    const parsed = PlayHeartbeatResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new Error("播放进度上报响应格式异常");
    }
    const { code, message } = parsed.data;
    if (code === -101 || code === -111) {
      throw new PlayHeartbeatLoginRequiredError("登录凭据失效，请重新登录 B站");
    }
    if (code !== 0) {
      throw new Error(`播放进度上报失败（${code}）：${message || "请稍后重试"}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

/** 开始播放：B站用它建立本次播放的点击记录，随后心跳才会写入观看历史 */
export async function reportPlayStart(
  account: PlayHeartbeatAccount,
  video: PlayHeartbeatVideo,
  session: PlayHeartbeatSession,
  dependencies: PlayHeartbeatRequestDependencies,
) {
  const { cookie, csrf, mid } = await resolveCredentials(account, dependencies);
  const keys = await dependencies.getWbiKeys();
  const query = encWbi(
    {
      w_aid: video.aid,
      w_part: video.page,
      w_ftime: session.startTs,
      w_stime: session.startTs,
      w_type: VIDEO_TYPE,
      web_location: WEB_LOCATION,
    },
    keys.img_url,
    keys.sub_url,
  );
  const body = new URLSearchParams({
    mid,
    aid: video.aid,
    cid: String(video.cid),
    part: String(video.page),
    ftime: String(session.startTs),
    stime: String(session.startTs),
    type: String(VIDEO_TYPE),
    sub_type: "0",
    refer_url: "",
    outer: "0",
    statistics: createStatistics(),
    mobi_app: "web",
    device: "web",
    platform: "web",
    cur_language: "",
    perfer_type: "",
    play_mode: "1",
    spmid: SPMID,
    from_spmid: SPMID,
    session: session.session,
    track_id: "",
    extra: createExtra(),
    csrf,
  });
  await postPlayReport(`${PLAY_START_URL}?${query}`, body, cookie, createReferer(video.bvid));
}

/** 播放进度心跳：played_time 决定观看历史里的进度，播放结束上报 -1 表示已看完 */
export async function reportPlayHeartbeat(
  account: PlayHeartbeatAccount,
  video: PlayHeartbeatVideo,
  session: PlayHeartbeatSession,
  report: PlayHeartbeatReport,
  dependencies: PlayHeartbeatRequestDependencies,
) {
  const { cookie, csrf, mid } = await resolveCredentials(account, dependencies);
  const keys = await dependencies.getWbiKeys();
  const videoDuration = Math.max(0, Math.round(report.videoDuration));
  const playedTime =
    report.type === PLAY_HEARTBEAT_TYPES.end ? -1 : Math.max(0, Math.round(report.playedTime));
  // 播完时用完整时长作为最后/最大进度；其它情况取当前位置
  const progressTime = playedTime < 0 ? videoDuration : playedTime;
  const maxPlayedTime = Math.max(session.maxPlayedTime, progressTime);
  const realPlayedTime = Math.max(0, Math.round(report.realPlayedTime));
  const query = encWbi(
    {
      w_start_ts: session.startTs,
      w_mid: mid,
      w_aid: video.aid,
      w_dt: DEVICE_TYPE,
      w_realtime: realPlayedTime,
      w_played_time: playedTime,
      w_real_played_time: realPlayedTime,
      w_video_duration: videoDuration,
      w_last_play_progress_time: progressTime,
      web_location: WEB_LOCATION,
    },
    keys.img_url,
    keys.sub_url,
  );
  const body = new URLSearchParams({
    start_ts: String(session.startTs),
    mid,
    aid: video.aid,
    cid: String(video.cid),
    type: String(VIDEO_TYPE),
    sub_type: "0",
    dt: String(DEVICE_TYPE),
    play_type: String(report.type),
    realtime: String(realPlayedTime),
    played_time: String(playedTime),
    real_played_time: String(realPlayedTime),
    refer_url: "",
    quality: String(report.quality),
    is_auto_qn: "1",
    video_duration: String(videoDuration),
    last_play_progress_time: String(progressTime),
    max_play_progress_time: String(maxPlayedTime),
    outer: "0",
    statistics: createStatistics(),
    mobi_app: "web",
    device: "web",
    platform: "web",
    cur_language_vt: "{}",
    perfer_type: "{}",
    play_mode: "1",
    spmid: SPMID,
    from_spmid: SPMID,
    session: session.session,
    track_id: "",
    extra: createExtra(),
    csrf,
  });
  await postPlayReport(`${HEARTBEAT_URL}?${query}`, body, cookie, createReferer(video.bvid));
}

/** 播放页使用的依赖：Cookie 由统一会话提供，wbi key 复用带 Cookie 的 nav 接口 */
export const playHeartbeatRequestDependencies: PlayHeartbeatRequestDependencies = {
  readCookie: getBilibiliLoginCookie,
  isCurrentAccount: bilibiliSession.isCurrentAccount,
  // getWBIInfo 命中缓存时是同步返回，统一成 Promise
  getWbiKeys: async () => getWBIInfo(fetcher),
};
