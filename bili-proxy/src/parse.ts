import {
  ALLOWED_PATHNAMES,
  BILI_ORIGIN,
  MAX_COOKIE_LENGTH,
  MAX_PATH_LENGTH,
  MAX_REQUEST_BYTES,
} from "./contract";
import type { BiliProfile, BiliProxyPayload } from "./contract";

export type ParseResult =
  | { ok: true; payload: BiliProxyPayload }
  | { error: string; ok: false; status: 400 | 403 | 413 };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProfile(value: unknown): value is BiliProfile {
  return value === "web" || value === "auth";
}

function isCookie(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_COOKIE_LENGTH &&
    !value.includes("\0") &&
    !/[\r\n]/.test(value)
  );
}

/** 把请求体解析成受信任的转发参数，任何越界都在这里挡掉。 */
export function parseProxyPayload(rawBody: string): ParseResult {
  if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BYTES) {
    return { error: "request_too_large", ok: false, status: 413 };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    return { error: "invalid_json", ok: false, status: 400 };
  }
  if (!isRecord(parsed)) return { error: "invalid_payload", ok: false, status: 400 };

  const { cookie, path, profile } = parsed;
  if (typeof path !== "string" || path.length === 0 || path.length > MAX_PATH_LENGTH) {
    return { error: "invalid_path", ok: false, status: 400 };
  }
  if (!isProfile(profile)) return { error: "invalid_profile", ok: false, status: 400 };
  if (cookie !== undefined && !isCookie(cookie)) {
    return { error: "invalid_cookie", ok: false, status: 400 };
  }

  let url: URL;
  try {
    url = new URL(path, BILI_ORIGIN);
  } catch {
    return { error: "invalid_path", ok: false, status: 400 };
  }
  // 绝对地址、协议相对地址、其他域名一律拒绝。
  if (url.origin !== BILI_ORIGIN) return { error: "host_not_allowed", ok: false, status: 403 };
  if (!ALLOWED_PATHNAMES.includes(url.pathname)) {
    return { error: "path_not_allowed", ok: false, status: 403 };
  }

  // cookie 只属于 auth，web 请求即使带了也不会被转发。
  return {
    ok: true,
    payload: {
      path: `${url.pathname}${url.search}`,
      profile,
      ...(profile === "auth" && typeof cookie === "string" ? { cookie } : {}),
    },
  };
}
