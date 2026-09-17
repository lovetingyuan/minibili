import type { BiliProfile } from "./contract.js";

/** 转发超时：留出比 Worker 侧（8s / 15s）更短的预算，让 Worker 拿到明确的上游错误。 */
export const UPSTREAM_TIMEOUT_MS: Readonly<Record<BiliProfile, number>> = {
  auth: 13_000,
  web: 7_000,
};

/**
 * 上游请求头全部由本服务决定，Worker 不能自定义任何 header，
 * 需要换 header 时只改这里。
 *
 * 实测（hkg1 出口，逐个 header 组合对比）：**只要带 User-Agent 就会被 B 站风控拦下**
 * （Chrome / Mozilla / 安卓 App / 完整浏览器头 + sec-ch-ua 全部返回 412 request was banned），
 * 不带 UA、或带 curl 这类非浏览器 UA 反而稳定 200。原因是这类机房 IP 上，
 * 「自称浏览器但 TLS 指纹不是浏览器」本身就是风控特征，所以这里刻意不发 UA。
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
    };
  }
  return {
    accept: "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9",
    "cache-control": "no-cache",
    referer: "https://www.bilibili.com/",
  };
}
