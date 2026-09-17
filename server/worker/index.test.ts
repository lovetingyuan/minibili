import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { SyncOperations } from "../../shared/user-data";
import { MAX_SYNC_BYTES } from "../../shared/user-data";

vi.mock("cloudflare:workers", () => ({ DurableObject: class {} }));

import { createApp } from "./index";
import { AUTH_TIMEOUT_MS } from "./services/bilibili-auth";
import { syncUserData } from "./user-data-store";
import { MemoryKvStorage } from "./testing/memory-kv";

const COOKIE = "SESSDATA=session; DedeUserID=123";
const validPayload = { code: 0, data: { profile: { mid: 123 } } };
const PROXY_URL = "https://minibili-bili-proxy.vercel.app";
const upstream = vi.fn<typeof fetch>();

function requestInfo(input: RequestInfo | URL | undefined, init?: RequestInit) {
  const url =
    typeof input === "string" ? input : input instanceof URL ? input.href : (input?.url ?? "");
  const payload: unknown =
    typeof init?.body === "string" ? (JSON.parse(init.body) as unknown) : undefined;
  const path = typeof payload === "object" && payload !== null ? Reflect.get(payload, "path") : "";
  const cookie =
    typeof payload === "object" && payload !== null ? Reflect.get(payload, "cookie") : undefined;
  return {
    cookie: typeof cookie === "string" ? cookie : null,
    path: typeof path === "string" ? path : "",
    url,
  };
}

function setup() {
  const app = createApp();
  const stores = new Map<string, MemoryKvStorage>();
  const getByName = vi.fn((uid: string) => {
    let storage = stores.get(uid);
    if (!storage) {
      storage = new MemoryKvStorage();
      stores.set(uid, storage);
    }
    const current = storage;
    return { syncData: async (operations: SyncOperations) => syncUserData(current, operations) };
  });
  const env = {
    BILIBILI_PROXY_TOKEN: "test-token",
    BILIBILI_PROXY_URL: PROXY_URL,
    USER_STORAGE: { getByName },
  };
  return {
    getByName,
    request: (path: string, init?: RequestInit) =>
      app.fetch(new Request(`https://example.com${path}`, init), env),
    sync: (body: unknown = { get: ["setting"] }, cookie: string | null = COOKIE) =>
      app.fetch(
        new Request("https://example.com/api/user-data/sync", {
          method: "POST",
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
            ...(cookie === null ? {} : { "X-Bilibili-Cookie": cookie }),
          },
        }),
        env,
      ),
  };
}
beforeEach(() => {
  upstream.mockReset().mockImplementation(async () => Response.json(validPayload));
  vi.stubGlobal("fetch", upstream);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("B站 identity boundary", () => {
  test.each([null, "", "DedeUserID=123", "buvid3=anonymous", "SESSDATA=; DedeUserID=123"])(
    "denies missing login credential %s without accessing DO",
    async (cookie) => {
      const server = setup();
      expect((await server.sync(undefined, cookie)).status).toBe(401);
      expect(server.getByName).not.toHaveBeenCalled();
      expect(upstream).not.toHaveBeenCalled();
    },
  );

  test("forged and expired credentials cannot read, write, or delete", async () => {
    const server = setup();
    upstream.mockImplementation(async () => Response.json({ code: -101 }));
    for (const operations of [
      { get: ["setting"] },
      { set: { setting: true } },
      { delete: ["setting"] },
    ]) {
      const response = await server.sync(operations);
      expect(response.status).toBe(401);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
    expect(server.getByName).not.toHaveBeenCalled();
  });

  test.each([
    { code: -352 },
    { code: 0 },
    { code: 0, data: { profile: { mid: -1 } } },
    { code: 0, data: { profile: { mid: "123" } } },
    null,
  ])("fails closed for unexpected upstream payload %j", async (payload) => {
    const server = setup();
    upstream.mockImplementation(async () => Response.json(payload));
    expect((await server.sync()).status).toBe(503);
    expect(server.getByName).not.toHaveBeenCalled();
  });

  test.each([302, 403, 412, 429, 500])("fails closed for upstream HTTP %i", async (status) => {
    const server = setup();
    upstream.mockImplementation(
      async () => new Response("upstream", { headers: { "x-proxy-source": "upstream" }, status }),
    );
    expect((await server.sync()).status).toBe(503);
    expect(server.getByName).not.toHaveBeenCalled();
  });

  test("timeouts and network errors never fall back to an unverified UID", async () => {
    vi.useFakeTimers();
    const server = setup();
    upstream.mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const request = server.sync();
    await vi.advanceTimersByTimeAsync(AUTH_TIMEOUT_MS + 10);
    expect((await request).status).toBe(503);
    expect(server.getByName).not.toHaveBeenCalled();
    upstream.mockRejectedValue(new Error("network"));
    expect((await server.sync()).status).toBe(503);
    expect(server.getByName).not.toHaveBeenCalled();
  });

  test("routes solely by verified UID and checks the upstream on every request", async () => {
    const server = setup();
    const response = await server.sync(
      { set: { futureSetting: [true, 3] }, get: ["futureSetting"] },
      "SESSDATA=session; DedeUserID=999",
    );
    expect(await response.json()).toEqual({
      success: true,
      uid: "123",
      result: { futureSetting: [true, 3] },
    });
    expect(server.getByName).toHaveBeenCalledExactlyOnceWith("123");
    expect(upstream).toHaveBeenCalledWith(
      `${PROXY_URL}/api/bili`,
      expect.objectContaining({
        headers: expect.objectContaining({ "x-proxy-token": "test-token" }),
        method: "POST",
      }),
    );
    const proxied = requestInfo(upstream.mock.calls[0]?.[0], upstream.mock.calls[0]?.[1]);
    expect(proxied).toEqual({
      cookie: "SESSDATA=session; DedeUserID=999",
      path: "/x/space/v2/myinfo",
      url: `${PROXY_URL}/api/bili`,
    });
    upstream.mockImplementation(async () =>
      Response.json({ code: 0, data: { profile: { mid: 456 } } }),
    );
    expect(await (await server.sync({ get: ["futureSetting"] })).json()).toEqual({
      success: true,
      uid: "456",
      result: {},
    });
    expect(upstream).toHaveBeenCalledTimes(2);
    upstream.mockImplementation(async () => Response.json({ code: -101 }));
    expect((await server.sync()).status).toBe(401);
    expect(server.getByName).toHaveBeenCalledTimes(2);
  });
});

describe("sync contract and unaffected routes", () => {
  test("persists ordered pinned IDs per verified account and supports clearing the array", async () => {
    const server = setup();
    const saved = await server.sync({
      set: { $pinnedUpIds: ["789", "456"] },
      get: ["$pinnedUpIds"],
    });
    expect(saved.status).toBe(200);
    expect(await saved.json()).toEqual({
      success: true,
      uid: "123",
      result: { $pinnedUpIds: ["789", "456"] },
    });
    expect(await (await server.sync({ get: ["$pinnedUpIds"] })).json()).toMatchObject({
      result: { $pinnedUpIds: ["789", "456"] },
    });
    upstream.mockResolvedValueOnce(Response.json({ code: 0, data: { profile: { mid: 999 } } }));
    expect(await (await server.sync({ get: ["$pinnedUpIds"] })).json()).toEqual({
      success: true,
      uid: "999",
      result: {},
    });
    expect((await server.sync({ set: { $pinnedUpIds: [] } })).status).toBe(200);
    expect(await (await server.sync({ get: ["$pinnedUpIds"] })).json()).toMatchObject({
      result: { $pinnedUpIds: [] },
    });
  });

  test.each(
    [
      {},
      [],
      { uid: "999", get: ["setting"] },
      { get: "setting" },
      { get: ["__proto__"] },
      { set: { constructor: true } },
      { set: { "": true } },
      { get: ["x".repeat(129)] },
      { get: Array.from({ length: 129 }, (_, i) => `key${i}`) },
    ].map((body) => ({ body })),
  )("rejects malformed operations $body before touching storage", async ({ body }) => {
    const server = setup();
    expect((await server.sync(body)).status).toBe(400);
    expect(server.getByName).not.toHaveBeenCalled();
  });
  test("limits the streamed request body without Content-Length", async () => {
    const server = setup();
    const response = await server.sync({ set: { large: "x".repeat(MAX_SYNC_BYTES) } });
    expect(response.status).toBe(413);
    expect(server.getByName).not.toHaveBeenCalled();
  });
  test("old email endpoints return 404 and cannot access DO", async () => {
    const server = setup();
    for (const path of [
      "/api/auth/otp",
      "/api/auth/verify",
      "/api/auth/status",
      "/api/auth/logout",
      "/api/users/user%40example.com/sync",
    ]) {
      expect((await server.request(path, { method: "POST" })).status).toBe(404);
    }
    expect(server.getByName).not.toHaveBeenCalled();
  });
  test("keeps health working and rejects unknown paths", async () => {
    const server = setup();
    expect(await (await server.request("/health")).json()).toMatchObject({
      service: "minibili-server",
      status: "ok",
    });
    expect((await server.request("/api/unknown")).status).toBe(404);
    expect(await (await server.request("/api/unknown")).text()).toBe("Not Found");
  });
});
