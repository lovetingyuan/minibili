// 分享页使用的纯函数：参数解析、URL 构造与展示格式化。

// bvid 固定为 BV 前缀 + 10 位 base58 字符
const BVID_PATTERN = /^BV[0-9A-Za-z]{10}$/;
export const MAX_PAGE = 2000;

export interface ShareParams {
  bvid: string;
  page: number;
}

/** 非法或超出分片数量的索引统一按第 1 个分片处理。 */
export function normalizePage(value: unknown, pageCount = MAX_PAGE) {
  const page = typeof value === "string" || typeof value === "number" ? Number(value) : Number.NaN;
  if (!Number.isSafeInteger(page) || page < 1) {
    return 1;
  }
  return page > pageCount ? 1 : page;
}

export function parseShareParams(search: string): ShareParams | null {
  const params = new URLSearchParams(search);
  const bvid = params.get("bvid")?.trim() ?? "";
  if (!BVID_PATTERN.test(bvid)) {
    return null;
  }
  return { bvid, page: normalizePage(params.get("p")) };
}

export function buildPlayerUrl(bvid: string, page: number) {
  return `https://player.bilibili.com/player.html?bvid=${bvid}&p=${page}`;
}

export function buildSourceUrl(bvid: string, page: number) {
  return `https://www.bilibili.com/video/${bvid}?p=${page}`;
}

/** 分享页自身的查询串，页面链接、canonical 与 og:url 共用。 */
export function buildShareSearch(bvid: string, page: number) {
  return `?bvid=${bvid}&p=${page}`;
}

/** B站图片地址可能是 http，https 页面下必须升级，否则会被浏览器拦截。 */
export function upgradeImageUrl(url: string) {
  return url.replace(/^http:\/\//i, "https://");
}

function formatUnit(scaled: number) {
  if (scaled >= 100) {
    return String(Math.round(scaled));
  }
  const fixed = (Math.round(scaled * 10) / 10).toFixed(1);
  return fixed.endsWith(".0") ? fixed.slice(0, -2) : fixed;
}

export function formatCount(value: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return "--";
  }
  if (value >= 100000000) {
    return `${formatUnit(value / 100000000)}亿`;
  }
  if (value >= 10000) {
    return `${formatUnit(value / 10000)}万`;
  }
  return String(Math.trunc(value));
}

export function formatDuration(seconds: number) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) {
    return "--";
  }
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`;
}

export function formatDate(seconds: number) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return "--";
  }
  const date = new Date(seconds * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join(" ");
}
