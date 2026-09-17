/**
 * Worker（server 子项目）与本服务之间的线上契约。
 * 对端实现见 server/worker/services/bilibili-proxy.ts，改动字段要两边一起改。
 */

/** 唯一允许转发的上游。 */
export const BILI_ORIGIN = "https://api.bilibili.com";

/** 路径白名单：带了查询串也要命中 pathname。 */
export const ALLOWED_PATHNAMES: readonly string[] = [
  "/x/web-interface/view",
  "/x/web-interface/view/detail",
  "/x/relation/stat",
  "/x/space/v2/myinfo",
];

/** auth 才允许带 cookie。 */
export type BiliProfile = "web" | "auth";

export interface BiliProxyPayload {
  cookie?: string;
  path: string;
  profile: BiliProfile;
}

export interface BiliProxyErrorBody {
  error: string;
}

export const MAX_PATH_LENGTH = 512;
export const MAX_REQUEST_BYTES = 32 * 1024;
export const MAX_COOKIE_LENGTH = 16 * 1024;

export const TOKEN_HEADER = "x-proxy-token";
export const SOURCE_HEADER = "x-proxy-source";

/** upstream = 原样透传 B 站响应；relay = 本服务自己产生的错误。 */
export type ProxySource = "relay" | "upstream";
