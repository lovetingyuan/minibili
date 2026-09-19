import { timingSafeEqual } from "node:crypto";

import { SOURCE_HEADER } from "./contract.js";
import type { BiliProxyErrorBody, ProxySource } from "./contract.js";
import { buildUpstreamHeaders, UPSTREAM_TIMEOUT_MS } from "./headers.js";
import { parseProxyPayload } from "./parse.js";
import { requestUpstream, UpstreamTimeoutError } from "./upstream.js";

export interface ProxyRequestInput {
  /** 原始请求体文本，已由适配层读取。 */
  body: string;
  method: string;
  token: string | null;
}

export interface ProxyResult {
  body: string;
  headers: Record<string, string>;
  status: number;
}

export interface ProxyEnv {
  token: string | undefined;
}

function proxyHeaders(source: ProxySource, contentType: string): Record<string, string> {
  return {
    "cache-control": "no-store",
    "content-type": contentType,
    [SOURCE_HEADER]: source,
  };
}

function relayError(status: number, error: string): ProxyResult {
  const body: BiliProxyErrorBody = { error };
  return {
    body: JSON.stringify(body),
    headers: proxyHeaders("relay", "application/json; charset=utf-8"),
    status,
  };
}

function tokensMatch(expected: string, provided: string): boolean {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

/**
 * 核心逻辑与 Vercel 解耦，方便单测；cookie 只用于转发，不写日志、不缓存。
 */
export async function handleBiliProxy(
  input: ProxyRequestInput,
  env: ProxyEnv,
): Promise<ProxyResult> {
  if (input.method.toUpperCase() !== "POST") {
    return relayError(405, "method_not_allowed");
  }
  if (!env.token) {
    return relayError(500, "proxy_misconfigured");
  }
  if (input.token === null || !tokensMatch(env.token, input.token)) {
    return relayError(401, "invalid_token");
  }

  const parsed = parseProxyPayload(input.body);
  if (!parsed.ok) {
    return relayError(parsed.status, parsed.error);
  }

  const { cookie, path, profile } = parsed.payload;
  const startedAt = Date.now();
  try {
    const upstream = await requestUpstream(
      path,
      buildUpstreamHeaders(profile, cookie),
      UPSTREAM_TIMEOUT_MS[profile],
    );
    if (upstream.status >= 400) {
      console.error("[bili-proxy] upstream rejected", {
        ms: Date.now() - startedAt,
        path,
        profile,
        status: upstream.status,
      });
    }
    return {
      body: upstream.body,
      headers: proxyHeaders("upstream", upstream.contentType),
      status: upstream.status,
    };
  } catch (error) {
    const timedOut = error instanceof UpstreamTimeoutError;
    console.error("[bili-proxy] upstream failed", {
      ms: Date.now() - startedAt,
      path,
      profile,
      reason: timedOut ? "timeout" : "network",
    });
    return relayError(timedOut ? 504 : 502, timedOut ? "upstream_timeout" : "upstream_unreachable");
  }
}
