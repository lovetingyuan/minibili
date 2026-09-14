import type { VideoInfoData, VideoInfoPage } from "../../../shared/video-info";
import { isRecord } from "../utils/request";

const VIEW_URL = "https://api.bilibili.com/x/web-interface/view";
const RELATION_URL = "https://api.bilibili.com/x/relation/stat";
export const VIDEO_INFO_TIMEOUT_MS = 8000;
/** 上游缓存秒数，分享页的播放数允许 5 分钟延迟。 */
export const VIDEO_INFO_CACHE_SECONDS = 300;

// B站接口要求带浏览器 UA 与 Referer，全程不携带任何 Cookie。
const UPSTREAM_HEADERS = {
  accept: "application/json, text/plain, */*",
  "accept-language": "zh-CN,zh;q=0.9",
  "cache-control": "no-cache",
  referer: "https://www.bilibili.com/",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
};

export class VideoNotFoundError extends Error {}
export class VideoUnavailableError extends Error {}

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toDimension(value: unknown) {
  if (!isRecord(value)) return { height: 0, rotate: 0, width: 0 };
  return {
    height: toNumber(value.height),
    rotate: toNumber(value.rotate),
    width: toNumber(value.width),
  };
}

function isFlag(value: unknown) {
  return value === 1 || value === true;
}

function mapPages(value: unknown): VideoInfoPage[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((page) => {
    const dimension = toDimension(page.dimension);
    return {
      cid: toNumber(page.cid),
      duration: toNumber(page.duration),
      firstFrame: toString(page.first_frame),
      height: dimension.height,
      page: toNumber(page.page),
      part: toString(page.part),
      width: dimension.width,
    };
  });
}

/** 把上游 view 接口的 data 映射成分享页使用的结构，缺少的字段降级为默认值。 */
function mapVideoInfo(value: unknown, requestedPage: number): VideoInfoData | null {
  if (!isRecord(value)) return null;
  const bvid = toString(value.bvid);
  const title = toString(value.title);
  const pages = mapPages(value.pages);
  if (!bvid || !title || pages.length === 0) return null;

  const currentPage =
    Number.isSafeInteger(requestedPage) && requestedPage >= 1 && requestedPage <= pages.length
      ? requestedPage
      : 1;
  const current = pages[currentPage - 1];
  const owner = isRecord(value.owner) ? value.owner : {};
  const stat = isRecord(value.stat) ? value.stat : {};
  const rights = isRecord(value.rights) ? value.rights : {};
  const argue = isRecord(value.argue_info) ? value.argue_info : {};
  const argueMessage = toString(argue.argue_msg);

  return {
    aid: toNumber(value.aid),
    argue: argueMessage ? { link: toString(argue.argue_link), message: argueMessage } : null,
    bvid,
    cid: current?.cid ?? toNumber(value.cid),
    copyright: toNumber(value.copyright),
    cover: toString(value.pic),
    ctime: toNumber(value.ctime),
    currentPage,
    desc: toString(value.desc),
    dimension: toDimension(value.dimension),
    // 分片时长优先于整部视频的总时长
    duration: current?.duration ?? toNumber(value.duration),
    owner: {
      face: toString(owner.face),
      fans: null,
      mid: toNumber(owner.mid),
      name: toString(owner.name),
    },
    pages,
    pubdate: toNumber(value.pubdate),
    rights: {
      is360: isFlag(rights.is_360),
      isCooperation: isFlag(rights.is_cooperation),
      isSteinGate: isFlag(rights.is_stein_gate),
      noReprint: isFlag(rights.no_reprint),
    },
    stat: {
      coin: toNumber(stat.coin),
      danmaku: toNumber(stat.danmaku),
      evaluation: toString(stat.evaluation),
      favorite: toNumber(stat.favorite),
      hisRank: toNumber(stat.his_rank),
      like: toNumber(stat.like),
      nowRank: toNumber(stat.now_rank),
      reply: toNumber(stat.reply),
      share: toNumber(stat.share),
      view: toNumber(stat.view),
    },
    title,
    tname: toString(value.tname),
    videos: toNumber(value.videos) || pages.length,
  };
}

async function fetchUpstreamJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VIDEO_INFO_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      cf: { cacheEverything: true, cacheTtl: VIDEO_INFO_CACHE_SECONDS },
      headers: UPSTREAM_HEADERS,
      // Workers 只支持 follow/manual，3xx 一律按不可用处理。
      redirect: "manual",
      signal: controller.signal,
    });
    if (!response.ok) throw new VideoUnavailableError();
    return (await response.json()) as unknown;
  } catch (error) {
    if (error instanceof VideoNotFoundError || error instanceof VideoUnavailableError) throw error;
    throw new VideoUnavailableError();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchUpFans(mid: number): Promise<number | null> {
  if (!Number.isSafeInteger(mid) || mid <= 0) return null;
  try {
    const payload = await fetchUpstreamJson(`${RELATION_URL}?vmid=${mid}`);
    if (!isRecord(payload) || payload.code !== 0 || !isRecord(payload.data)) return null;
    const follower = payload.data.follower;
    return typeof follower === "number" && Number.isFinite(follower) ? follower : null;
  } catch {
    return null;
  }
}

export async function fetchVideoInfo(bvid: string, requestedPage: number): Promise<VideoInfoData> {
  const payload = await fetchUpstreamJson(`${VIEW_URL}?bvid=${encodeURIComponent(bvid)}`);
  if (!isRecord(payload)) throw new VideoUnavailableError();
  if (payload.code === -404) throw new VideoNotFoundError();
  if (payload.code !== 0) throw new VideoUnavailableError();
  const data = mapVideoInfo(payload.data, requestedPage);
  if (!data) throw new VideoUnavailableError();
  data.owner.fans = await fetchUpFans(data.owner.mid);
  return data;
}
