import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  BilibiliBlockedError,
  BilibiliProxyUnavailableError,
  callBilibili,
} from "./bilibili-proxy";
import type { CallBilibiliOptions } from "./bilibili-proxy";

// 故意带结尾斜杠，用来验证地址会被规范化
const BINDINGS = {
  BILIBILI_PROXY_TOKEN: "test-token",
  BILIBILI_PROXY_URL: "https://proxy.example.com/",
};
const VIEW_PATH = "/x/web-interface/view?bvid=BV1XctB6PEuZ";
const upstream = vi.fn<typeof fetch>();

function proxyCall(index: number) {
  const init = upstream.mock.calls[index]?.[1];
  const url = upstream.mock.calls[index]?.[0];
  const payload: unknown =
    typeof init?.body === "string" ? (JSON.parse(init.body) as unknown) : undefined;
  return {
    body: typeof payload === "object" && payload !== null ? payload : null,
    init,
    url: typeof url === "string" ? url : url instanceof URL ? url.href : (url?.url ?? ""),
  };
}

function options(overrides: Partial<CallBilibiliOptions> = {}): CallBilibiliOptions {
  return { path: VIEW_PATH, profile: "web", timeoutMs: 1000, ...overrides };
}

function memoryCache() {
  const entries = new Map<string, Response>();
  return {
    entries,
    match: async (key: string) => entries.get(key)?.clone(),
    put: async (key: string, response: Response) => {
      entries.set(key, response.clone());
    },
  };
}

function respondJson(payload: unknown) {
  return Response.json(payload, { headers: { "x-proxy-source": "upstream" } });
}

beforeEach(() => {
  upstream.mockReset().mockImplementation(async () => respondJson({ code: 0, data: {} }));
  vi.stubGlobal("fetch", upstream);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("bili-proxy 调用", () => {
  test("只请求 proxy，并把 path/profile/cookie 放进请求体", async () => {
    await callBilibili(
      BINDINGS,
      options({ path: "/x/space/v2/myinfo", profile: "auth", cookie: "SESSDATA=session" }),
    );

    expect(upstream).toHaveBeenCalledTimes(1);
    const call = proxyCall(0);
    expect(call.url).toBe("https://proxy.example.com/api/bili");
    expect(call.init?.headers).toMatchObject({ "x-proxy-token": "test-token" });
    expect(call.body).toEqual({
      cookie: "SESSDATA=session",
      path: "/x/space/v2/myinfo",
      profile: "auth",
    });
  });

  test("匿名请求不带 cookie 字段", async () => {
    await callBilibili(BINDINGS, options({ cookie: "SESSDATA=session" }));
    expect(proxyCall(0).body).toEqual({ path: VIEW_PATH, profile: "web" });
  });

  test("上游 412 抛 BilibiliBlockedError 且不重试", async () => {
    upstream.mockImplementation(
      async () =>
        new Response("blocked", { headers: { "x-proxy-source": "upstream" }, status: 412 }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(callBilibili(BINDINGS, options())).rejects.toBeInstanceOf(BilibiliBlockedError);
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  test("业务码 -412 / -799 同样按风控处理", async () => {
    upstream.mockImplementation(async () => respondJson({ code: -412, message: "请求被拦截" }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(callBilibili(BINDINGS, options())).rejects.toBeInstanceOf(BilibiliBlockedError);
  });

  test("proxy 5xx 重试一次后按不可用处理", async () => {
    upstream.mockImplementation(
      async () =>
        new Response(JSON.stringify({ error: "upstream_unreachable" }), {
          headers: { "x-proxy-source": "relay" },
          status: 502,
        }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(callBilibili(BINDINGS, options())).rejects.toBeInstanceOf(
      BilibiliProxyUnavailableError,
    );
    expect(upstream).toHaveBeenCalledTimes(2);
  });

  test("网络异常重试一次后按不可用处理", async () => {
    upstream.mockRejectedValue(new Error("network"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(callBilibili(BINDINGS, options())).rejects.toBeInstanceOf(
      BilibiliProxyUnavailableError,
    );
    expect(upstream).toHaveBeenCalledTimes(2);
  });
});

describe("缓存", () => {
  test("只缓存业务码为 0 的匿名响应", async () => {
    const cache = memoryCache();
    vi.stubGlobal("caches", { default: cache });
    upstream.mockImplementation(async () => respondJson({ code: 0, data: { title: "标题" } }));

    const first = await callBilibili(BINDINGS, options({ cacheSeconds: 300 }));
    const second = await callBilibili(BINDINGS, options({ cacheSeconds: 300 }));

    expect(first).toEqual({ code: 0, data: { title: "标题" } });
    expect(second).toEqual(first);
    expect(upstream).toHaveBeenCalledTimes(1);
    expect(cache.entries.size).toBe(1);
  });

  test("失败结果与 auth 响应都不进缓存", async () => {
    const cache = memoryCache();
    vi.stubGlobal("caches", { default: cache });
    upstream.mockImplementation(async () => respondJson({ code: -404, message: "啥都木有" }));

    await callBilibili(BINDINGS, options({ cacheSeconds: 300 }));
    expect(cache.entries.size).toBe(0);

    upstream.mockImplementation(async () =>
      respondJson({ code: 0, data: { profile: { mid: 1 } } }),
    );
    await callBilibili(
      BINDINGS,
      options({
        cacheSeconds: 300,
        cookie: "SESSDATA=session",
        path: "/x/space/v2/myinfo",
        profile: "auth",
      }),
    );
    expect(cache.entries.size).toBe(0);
  });
});
