import { afterEach, describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import { modifyBilibiliRelation, RelationLoginRequiredError } from "./modify-relation";
import type { RelationChange, RelationRequestDependencies } from "./modify-relation.types";

const account = { mid: "123", generation: 2 };
const cookie = "SESSDATA=test-session; DedeUserID=123; bili_jct=csrf-test";
const up = { mid: "397490386", name: "测试UP", face: "", sign: "" };
const follow: RelationChange = { up, act: 1 };

function setup(value: string | null = cookie) {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ code: 0, message: "OK" }));
  vi.stubGlobal("fetch", request);
  const dependencies: RelationRequestDependencies = {
    readCookie: vi.fn(async () => value),
    isCurrentAccount: vi.fn(() => true),
  };
  return { request, dependencies };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Bilibili relationship modification", () => {
  test.each([1, 2] as const)(
    "sends act=%s with form data and a single credential snapshot",
    async (act) => {
      const { request, dependencies } = setup();
      const change = { up, act };
      await expect(modifyBilibiliRelation(account, change, dependencies)).resolves.toEqual(change);
      expect(request).toHaveBeenCalledOnce();
      expect(dependencies.readCookie).toHaveBeenCalledOnce();
      const [url, options] = request.mock.calls[0];
      const parsedUrl = new URL(String(url));
      expect(parsedUrl.origin + parsedUrl.pathname).toBe(
        "https://api.bilibili.com/x/relation/modify",
      );
      expect(JSON.parse(parsedUrl.searchParams.get("statistics") || "")).toEqual({
        appId: 100,
        platform: 5,
      });
      expect(JSON.parse(parsedUrl.searchParams.get("x-bili-device-req-json") || "")).toEqual({
        platform: "web",
        device: "pc",
        spmid: "333.1387",
      });
      const headers = new Headers(options?.headers);
      expect(headers.get("cookie")).toBe(cookie);
      expect(headers.get("content-type")).toBe("application/x-www-form-urlencoded");
      expect(headers.get("referer")).toBe("https://space.bilibili.com/" + up.mid);
      expect(headers.has("sec-fetch-mode")).toBe(false);
      expect(options?.method).toBe("POST");
      expect(options?.credentials).toBe("omit");
      const body = new URLSearchParams(String(options?.body));
      expect(Object.fromEntries(body)).toEqual({
        fid: up.mid,
        act: String(act),
        csrf: "csrf-test",
        re_src: "11",
        gaia_source: "web_main",
        spmid: "333.1387",
        is_from_frontend_component: "true",
        extend_content: JSON.stringify({ entity: "user", entity_id: Number(up.mid) }),
      });
    },
  );

  test("uses the supplied target and encodes the CSRF value without changing the Cookie", async () => {
    const value = "SESSDATA=test; DedeUserID=123; bili_jct=a+b/==";
    const { request, dependencies } = setup(value);
    await modifyBilibiliRelation(account, { up: { ...up, mid: 456 }, act: 1 }, dependencies);
    const options = request.mock.calls[0][1];
    expect(new Headers(options?.headers).get("cookie")).toBe(value);
    expect(new URLSearchParams(String(options?.body)).get("csrf")).toBe("a+b/==");
    expect(new URLSearchParams(String(options?.body)).get("fid")).toBe("456");
  });

  test.each([
    null,
    "",
    "DedeUserID=123; bili_jct=x",
    "SESSDATA=x; DedeUserID=123",
    "SESSDATA=x; DedeUserID=123; bili_jct=;",
  ])("blocks missing credentials: %s", async (value) => {
    const { request, dependencies } = setup(value);
    await expect(modifyBilibiliRelation(account, follow, dependencies)).rejects.toBeInstanceOf(
      RelationLoginRequiredError,
    );
    expect(request).not.toHaveBeenCalled();
  });

  test("blocks a cookie belonging to another account", async () => {
    const { request, dependencies } = setup("SESSDATA=x; DedeUserID=456; bili_jct=x");
    await expect(modifyBilibiliRelation(account, follow, dependencies)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    expect(request).not.toHaveBeenCalled();
  });

  test.each(["0", "-1", "bad", "9007199254740993"])("blocks an invalid MID: %s", async (mid) => {
    const { request, dependencies } = setup();
    await expect(
      modifyBilibiliRelation(account, { ...follow, up: { ...up, mid } }, dependencies),
    ).rejects.toThrow("ID 无效");
    expect(request).not.toHaveBeenCalled();
  });

  test.each([
    Response.json({ code: -352, message: "操作被拒绝" }),
    Response.json({ code: 0 }, { status: 503 }),
    Response.json({ code: "0" }),
    Response.json({ data: null }),
    new Response("not json"),
  ])("rejects failed or malformed responses without retrying", async (response) => {
    const { request, dependencies } = setup();
    request.mockResolvedValue(response);
    await expect(modifyBilibiliRelation(account, follow, dependencies)).rejects.toBeInstanceOf(
      Error,
    );
    expect(request).toHaveBeenCalledOnce();
  });

  test.each([-101, -111])("requires login on business code %s", async (code) => {
    const { request, dependencies } = setup();
    request.mockResolvedValue(Response.json({ code }));
    await expect(modifyBilibiliRelation(account, follow, dependencies)).rejects.toBeInstanceOf(
      RelationLoginRequiredError,
    );
  });

  test("preserves network errors and never retries the POST", async () => {
    const { request, dependencies } = setup();
    request.mockRejectedValue(new Error("offline"));
    await expect(modifyBilibiliRelation(account, follow, dependencies)).rejects.toThrow("offline");
    expect(request).toHaveBeenCalledOnce();
  });

  test("does not submit if the session changes while reading credentials", async () => {
    const { request, dependencies } = setup();
    let current = true;
    dependencies.isCurrentAccount = () => current;
    dependencies.readCookie = async () => {
      current = false;
      return cookie;
    };
    await expect(modifyBilibiliRelation(account, follow, dependencies)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    expect(request).not.toHaveBeenCalled();
  });

  test("does not read credentials or submit for an obsolete session", async () => {
    const { request, dependencies } = setup();
    dependencies.isCurrentAccount = () => false;
    await expect(modifyBilibiliRelation(account, follow, dependencies)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    expect(dependencies.readCookie).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  test("checks the session again after the response body finishes loading", async () => {
    const { request, dependencies } = setup();
    let current = true;
    dependencies.isCurrentAccount = () => current;
    const response = Response.json({ code: 0 });
    vi.spyOn(response, "json").mockImplementation(async () => {
      current = false;
      return { code: 0 };
    });
    request.mockResolvedValue(response);
    await expect(modifyBilibiliRelation(account, follow, dependencies)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
  });

  test("discards a success received after logout or account switching", async () => {
    const { request, dependencies } = setup();
    let current = true;
    dependencies.isCurrentAccount = () => current;
    request.mockImplementation(async () => {
      current = false;
      return Response.json({ code: 0 });
    });
    await expect(modifyBilibiliRelation(account, follow, dependencies)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
  });

  test("aborts after 15 seconds without retrying", async () => {
    vi.useFakeTimers();
    const { request, dependencies } = setup();
    request.mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const result = expect(modifyBilibiliRelation(account, follow, dependencies)).rejects.toThrow(
      "超时",
    );
    await vi.advanceTimersByTimeAsync(15000);
    await result;
    expect(request).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
