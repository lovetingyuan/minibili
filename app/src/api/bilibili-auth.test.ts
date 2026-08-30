import { afterEach, describe, expect, test, vi } from "vitest";

import { validateBilibiliCookie } from "./bilibili-auth";

const PROFILE = {
  mid: 393120021,
  name: "聪颖的雪",
  face: "https://i0.hdslb.com/bfs/face/a7842cc39d5d09d24ff0d89d9b591758f15d7aac.jpg",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Bilibili myinfo validation", () => {
  test("returns profile fields and data.follower using the candidate cookie without ambient credentials", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        code: 0,
        message: "OK",
        data: {
          profile: { ...PROFILE, sign: "提升自己，远离垃圾", vip: {} },
          following: 48,
          follower: 82,
        },
        ttl: 1,
      }),
    );
    vi.stubGlobal("fetch", request);
    await expect(
      validateBilibiliCookie("SESSDATA=candidate; DedeUserID=393120021"),
    ).resolves.toEqual({ ...PROFILE, follower: 82 });
    const [url, options] = request.mock.calls[0];
    expect(url).toBe("https://api.bilibili.com/x/space/v2/myinfo");
    expect(new Headers(options?.headers).get("cookie")).toBe(
      "SESSDATA=candidate; DedeUserID=393120021",
    );
    expect(options?.credentials).toBe("omit");
    expect(request).toHaveBeenCalledOnce();
  });

  test("only -101 means unauthenticated", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ code: -101, message: "账号未登录", ttl: 1 })),
    );
    await expect(validateBilibiliCookie("expired")).resolves.toBeNull();
  });

  test.each([
    Response.json({ code: -352, message: "风控" }),
    Response.json({ code: 0 }, { status: 503 }),
    Response.json({ unexpected: true }),
    Response.json({ code: "0" }),
    new Response("not json"),
  ])("rejects HTTP, API and malformed responses instead of logging out", async (response) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    await expect(validateBilibiliCookie("saved")).rejects.toBeInstanceOf(Error);
  });

  test("preserves network failures as errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(validateBilibiliCookie("saved")).rejects.toThrow("offline");
  });

  test.each([
    { code: 0 },
    { code: 0, data: null },
    { code: 0, data: {} },
    { code: 0, data: { profile: null } },
    { code: 0, data: { profile: { mid: PROFILE.mid, name: PROFILE.name } } },
    { code: 0, data: { profile: { ...PROFILE, mid: "393120021" } } },
    { code: 0, data: { profile: { ...PROFILE, name: null } } },
    { code: 0, data: { profile: { ...PROFILE, face: 123 } } },
  ])("rejects missing or malformed successful profile data: %j", async (payload) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(payload)));
    await expect(validateBilibiliCookie("saved")).rejects.toBeInstanceOf(Error);
  });

  test("accepts an empty avatar URL so the header can show its placeholder", async () => {
    const profile = { ...PROFILE, face: "" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ code: 0, data: { profile } })),
    );
    await expect(validateBilibiliCookie("saved")).resolves.toEqual(profile);
  });

  test.each([0, undefined])("preserves zero or absent follower counts (%s)", async (follower) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ code: 0, data: { profile: PROFILE, follower } })),
    );
    await expect(validateBilibiliCookie("saved")).resolves.toEqual({ ...PROFILE, follower });
  });

  test("times out an unresponsive request", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            options?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
          }),
      ),
    );
    const result = expect(validateBilibiliCookie("saved")).rejects.toThrow("aborted");
    await vi.advanceTimersByTimeAsync(15000);
    await result;
  });

  test("forwards cancellation when the login page leaves the foreground", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ code: 0, data: { profile: PROFILE } }));
    vi.stubGlobal("fetch", request);
    const controller = new AbortController();
    const pending = validateBilibiliCookie("candidate", controller.signal);
    controller.abort();
    expect(request.mock.calls[0][1]?.signal?.aborted).toBe(true);
    await pending;
  });
});
