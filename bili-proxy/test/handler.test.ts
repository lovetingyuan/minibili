import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { handleBiliProxy } from "../src/handler.js";
import { UPSTREAM_TIMEOUT_MS } from "../src/headers.js";

const TOKEN = "test-token";
const VIEW_PATH = "/x/web-interface/view?bvid=BV1XctB6PEuZ";
const upstream = vi.fn<typeof fetch>();

function call(
  body: unknown,
  options: { method?: string; token?: string | null } = {},
): ReturnType<typeof handleBiliProxy> {
  return handleBiliProxy(
    {
      body: typeof body === "string" ? body : JSON.stringify(body),
      method: options.method ?? "POST",
      token: options.token === undefined ? TOKEN : options.token,
    },
    { token: TOKEN },
  );
}

beforeEach(() => {
  upstream.mockReset().mockImplementation(async () => Response.json({ code: 0, data: {} }));
  vi.stubGlobal("fetch", upstream);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("入参校验", () => {
  test("拒绝非 POST", async () => {
    const result = await call({ path: VIEW_PATH, profile: "web" }, { method: "GET" });
    expect(result.status).toBe(405);
    expect(result.headers["x-proxy-source"]).toBe("relay");
    expect(upstream).not.toHaveBeenCalled();
  });

  test.each([null, "", "wrong-token"])("拒绝 token %s", async (token) => {
    const result = await call({ path: VIEW_PATH, profile: "web" }, { token });
    expect(result.status).toBe(401);
    expect(upstream).not.toHaveBeenCalled();
  });

  test("未配置 token 时按配置错误处理", async () => {
    const result = await handleBiliProxy(
      { body: JSON.stringify({ path: VIEW_PATH, profile: "web" }), method: "POST", token: TOKEN },
      { token: undefined },
    );
    expect(result.status).toBe(500);
    expect(upstream).not.toHaveBeenCalled();
  });

  test("拒绝白名单以外的域名与路径", async () => {
    const otherHost = await call({
      path: "https://example.com/x/web-interface/view",
      profile: "web",
    });
    expect(otherHost.status).toBe(403);
    const otherPath = await call({ path: "/x/web-interface/archive/stat?aid=1", profile: "web" });
    expect(otherPath.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });

  test("拒绝超大请求体、非法 cookie 与未知 profile", async () => {
    const huge = await call({ path: VIEW_PATH, profile: "web", note: "x".repeat(40_000) });
    expect(huge.status).toBe(413);
    const longCookie = await call({
      path: "/x/space/v2/myinfo",
      profile: "auth",
      cookie: "x".repeat(16 * 1024 + 1),
    });
    expect(longCookie.status).toBe(400);
    const badProfile = await call({ path: VIEW_PATH, profile: "mobile" });
    expect(badProfile.status).toBe(400);
    const multiline = await call({
      path: "/x/space/v2/myinfo",
      profile: "auth",
      cookie: "SESSDATA=a\r\nX: 1",
    });
    expect(multiline.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });
});

describe("转发行为", () => {
  test("把上游状态码与响应体原样带回去", async () => {
    upstream.mockImplementation(async () =>
      Response.json({ code: -404, message: "啥都木有" }, { status: 200 }),
    );
    const result = await call({ path: VIEW_PATH, profile: "web" });

    expect(upstream).toHaveBeenCalledWith(
      `https://api.bilibili.com${VIEW_PATH}`,
      expect.objectContaining({ redirect: "follow" }),
    );
    expect(result.status).toBe(200);
    expect(result.headers["x-proxy-source"]).toBe("upstream");
    expect(JSON.parse(result.body)).toEqual({ code: -404, message: "啥都木有" });
  });

  test("上游风控状态码不会被改写成 502", async () => {
    upstream.mockImplementation(async () => new Response("blocked", { status: 412 }));
    const result = await call({ path: VIEW_PATH, profile: "web" });

    expect(result.status).toBe(412);
    expect(result.headers["x-proxy-source"]).toBe("upstream");
    expect(result.body).toBe("blocked");
  });

  test("auth 转发 cookie，web 丢弃 cookie", async () => {
    await call({ path: "/x/space/v2/myinfo", profile: "auth", cookie: "SESSDATA=session" });
    expect(upstream.mock.calls[0]?.[1]?.headers).toMatchObject({ cookie: "SESSDATA=session" });
    expect(upstream.mock.calls[0]?.[1]?.headers).toMatchObject({
      referer: "https://space.bilibili.com/",
    });

    upstream.mockClear();
    await call({ path: VIEW_PATH, profile: "web", cookie: "SESSDATA=session" });
    expect(upstream.mock.calls[0]?.[1]?.headers).not.toHaveProperty("cookie");
  });

  // 机房出口带 UA（哪怕伪装成 Chrome）会被 B 站风控 412 request was banned，见 src/headers.ts 注释
  test.each(["web", "auth"] as const)("%s profile 不发送 User-Agent", async (profile) => {
    await call({
      path: profile === "auth" ? "/x/space/v2/myinfo" : VIEW_PATH,
      profile,
      ...(profile === "auth" ? { cookie: "SESSDATA=session" } : {}),
    });
    const headers = upstream.mock.calls[0]?.[1]?.headers as Record<string, string> | undefined;
    expect(headers).toBeDefined();
    expect(Object.keys(headers ?? {}).map((key) => key.toLowerCase())).not.toContain("user-agent");
  });

  test("超时返回 504，网络异常返回 502", async () => {
    vi.useFakeTimers();
    upstream.mockImplementation(
      (_input, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const pending = call({ path: VIEW_PATH, profile: "web" });
    await vi.advanceTimersByTimeAsync(UPSTREAM_TIMEOUT_MS.web + 10);
    const timedOut = await pending;
    expect(timedOut.status).toBe(504);
    expect(JSON.parse(timedOut.body)).toEqual({ error: "upstream_timeout" });

    vi.useRealTimers();
    upstream.mockRejectedValue(new Error("network"));
    const failed = await call({ path: VIEW_PATH, profile: "web" });
    expect(failed.status).toBe(502);
    expect(failed.headers["x-proxy-source"]).toBe("relay");
  });

  test("cookie 不会出现在日志里", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    upstream.mockImplementation(async () => new Response("blocked", { status: 412 }));

    await call({ path: "/x/space/v2/myinfo", profile: "auth", cookie: "SESSDATA=super-secret" });
    await call({ path: VIEW_PATH, profile: "web" });

    const logged = [...error.mock.calls, ...log.mock.calls]
      .flat()
      .map((value) => JSON.stringify(value));
    expect(logged.join(" ")).not.toContain("super-secret");
    expect(logged.join(" ")).toContain("/x/space/v2/myinfo");
    error.mockRestore();
    log.mockRestore();
  });
});
