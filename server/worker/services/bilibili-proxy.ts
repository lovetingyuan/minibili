import { isRecord } from "../utils/request";

/**
 * 与 bili-proxy 子项目（bili-proxy/src/contract.ts）的线上契约，改字段要两边一起改。
 *
 * Worker 的出站 IP 会被 B 站风控直接拒绝，所以这里不保留任何直连 B 站的路径，
 * 统一走部署在 Vercel 的 bili-proxy。
 */
const SOURCE_HEADER = "x-proxy-source";
const TOKEN_HEADER = "x-proxy-token";

export const BILI_VIEW_PATH = "/x/web-interface/view";
export const BILI_RELATION_STAT_PATH = "/x/relation/stat";
export const BILI_MYINFO_PATH = "/x/space/v2/myinfo";

export type BilibiliProfile = "web" | "auth";

export interface BilibiliProxyBindings {
  BILIBILI_PROXY_TOKEN: string;
  BILIBILI_PROXY_URL: string;
}

/** B 站明确拒绝服务（风控），调用方应转成「暂时不可用」，不要重试。 */
export class BilibiliBlockedError extends Error {}
/** proxy 不可达、超时、返回异常结构，或上游 5xx。 */
export class BilibiliProxyUnavailableError extends Error {}

export interface CallBilibiliOptions {
  /** 只对匿名 web 请求生效；auth 响应带用户数据，永不缓存。 */
  cacheSeconds?: number;
  cookie?: string;
  path: string;
  profile: BilibiliProfile;
  timeoutMs: number;
}

interface ProxyResponse {
  body: string;
  ok: boolean;
  source: string | null;
  status: number;
}

interface UpstreamCache {
  match(key: string): Promise<Response | undefined>;
  put(key: string, response: Response): Promise<void>;
}

const ATTEMPTS = 2;

/** 本次调用的时间预算已耗尽（AbortController 触发）。 */
class ProxyTimeoutError extends Error {}

function proxyBase(bindings: BilibiliProxyBindings) {
  return bindings.BILIBILI_PROXY_URL.replace(/\/+$/, "");
}

/** 单测（Node 环境）没有 caches，自动跳过缓存。 */
function getUpstreamCache(): UpstreamCache | null {
  if (typeof caches !== "object" || caches === null) {
    return null;
  }
  const cache = caches.default;
  if (!cache) {
    return null;
  }
  return {
    match: (key) => cache.match(key),
    put: async (key, response) => {
      await cache.put(key, response);
    },
  };
}

function isBlockedStatus(status: number) {
  return status === 403 || status === 412;
}

function log(message: string, detail: Record<string, unknown>) {
  console.error(`[bili-proxy] ${message}`, detail);
}

async function requestProxy(
  bindings: BilibiliProxyBindings,
  options: CallBilibiliOptions,
): Promise<ProxyResponse> {
  const payload: Record<string, string> = { path: options.path, profile: options.profile };
  if (options.profile === "auth" && options.cookie) {
    payload.cookie = options.cookie;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await fetch(`${proxyBase(bindings)}/api/bili`, {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json",
        [TOKEN_HEADER]: bindings.BILIBILI_PROXY_TOKEN,
      },
      method: "POST",
      signal: controller.signal,
    });
    return {
      body: await response.text(),
      ok: response.ok,
      source: response.headers.get(SOURCE_HEADER),
      status: response.status,
    };
  } catch (error) {
    // 按 signal 判定，兼容各种 fetch 实现抛出的错误类型差异。
    if (controller.signal.aborted) {
      throw new ProxyTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function readCacheKey(bindings: BilibiliProxyBindings, options: CallBilibiliOptions) {
  if (!options.cacheSeconds || options.profile !== "web") {
    return null;
  }
  return `${proxyBase(bindings)}/__cache${options.path}`;
}

/**
 * 调一次 bili-proxy 并返回解析后的 B 站 payload。
 * 网络错误与上游 5xx 会重试 1 次；超时、风控状态直接失败，不再重试。
 */
export async function callBilibili(
  bindings: BilibiliProxyBindings,
  options: CallBilibiliOptions,
): Promise<unknown> {
  const base = proxyBase(bindings);
  if (!base) {
    log("BILIBILI_PROXY_URL is not configured", { path: options.path });
    throw new BilibiliProxyUnavailableError();
  }

  const cacheKey = readCacheKey(bindings, options);
  const cache = cacheKey ? getUpstreamCache() : null;
  if (cache && cacheKey) {
    try {
      const cached = await cache.match(cacheKey);
      if (cached) {
        return JSON.parse(await cached.text()) as unknown;
      }
    } catch {
      // 缓存不可用（例如 workers.dev 上没有默认缓存）或内容坏掉时，按未命中处理。
    }
  }

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const startedAt = Date.now();
    let response: ProxyResponse;
    try {
      response = await requestProxy(bindings, options);
    } catch (error) {
      const timedOut = error instanceof ProxyTimeoutError;
      log(timedOut ? "proxy timeout" : "proxy unreachable", {
        attempt,
        ms: Date.now() - startedAt,
        path: options.path,
        profile: options.profile,
      });
      // 超时说明预算已经用尽，重试只会把总耗时翻倍。
      if (timedOut) {
        throw new BilibiliProxyUnavailableError();
      }
      continue;
    }

    if (!response.ok) {
      log("proxy returned error", {
        attempt,
        ms: Date.now() - startedAt,
        path: options.path,
        profile: options.profile,
        source: response.source,
        status: response.status,
      });
      if (response.source === "upstream" && isBlockedStatus(response.status)) {
        throw new BilibiliBlockedError();
      }
      if (response.status >= 500 && attempt < ATTEMPTS) {
        continue;
      }
      throw new BilibiliProxyUnavailableError();
    }

    let payload: unknown;
    try {
      payload = JSON.parse(response.body) as unknown;
    } catch {
      log("proxy returned invalid json", {
        attempt,
        path: options.path,
        profile: options.profile,
        status: response.status,
      });
      continue;
    }

    if (isRecord(payload) && (payload.code === -412 || payload.code === -799)) {
      log("bilibili blocked the request", {
        code: payload.code,
        path: options.path,
        profile: options.profile,
      });
      throw new BilibiliBlockedError();
    }

    if (cache && cacheKey && isRecord(payload) && payload.code === 0) {
      try {
        await cache.put(
          cacheKey,
          new Response(JSON.stringify(payload), {
            headers: {
              "cache-control": `public, max-age=${options.cacheSeconds}`,
              "content-type": "application/json; charset=utf-8",
            },
          }),
        );
      } catch {
        log("cache put failed", { path: options.path });
      }
    }
    return payload;
  }

  throw new BilibiliProxyUnavailableError();
}
