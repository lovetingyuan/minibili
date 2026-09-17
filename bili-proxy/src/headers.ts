import type { BiliProfile } from "./contract";

/** 转发超时：留出比 Worker 侧（8s / 15s）更短的预算，让 Worker 拿到明确的上游错误。 */
export const UPSTREAM_TIMEOUT_MS: Readonly<Record<BiliProfile, number>> = {
  auth: 13_000,
  web: 7_000,
};

const WEB_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

/**
 * 上游请求头全部由本服务决定，Worker 不能自定义任何 header，
 * 需要换 UA / Referer 时只改这里。
 */
export function buildUpstreamHeaders(
  profile: BiliProfile,
  cookie?: string,
): Record<string, string> {
  if (profile === "auth") {
    return {
      accept: "application/json",
      "cache-control": "no-cache",
      cookie: cookie ?? "",
      referer: "https://space.bilibili.com/",
      "user-agent": "Mozilla/5.0",
    };
  }
  return {
    accept: "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9",
    "cache-control": "no-cache",
    referer: "https://www.bilibili.com/",
    "user-agent": WEB_USER_AGENT,
  };
}
