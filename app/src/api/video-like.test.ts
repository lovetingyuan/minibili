import { afterEach, describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  modifyVideoLike,
  VideoLikeLoginRequiredError,
  VideoLikeResultUnknownError,
} from "./video-like";
import type { VideoLikeRequestDependencies } from "./video-like.types";

const account = { mid: "123", generation: 1 };
const video = { aid: "116378950441190", bvid: "BV1VeQFBDEC2" };
const cookie = "SESSDATA=test-session; DedeUserID=123; bili_jct=a+b/==; buvid3=test-device";
const success = { code: 0, message: "OK", ttl: 1 };

function setup(value: string | null = cookie) {
  const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json(success));
  vi.stubGlobal("fetch", request);
  const dependencies: VideoLikeRequestDependencies = {
    readCookie: vi.fn(async () => value),
    isCurrentAccount: vi.fn(() => true),
  };
  return { request, dependencies };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe.each([true, false])("video like request liked=%s", (liked) => {
  test("sends the requested form using current video and a single Cookie/CSRF snapshot; accepts no data field", async () => {
    const { request, dependencies } = setup();
    const change = { video, liked };
    await expect(modifyVideoLike(account, change, dependencies)).resolves.toEqual(change);
    expect(request).toHaveBeenCalledOnce();
    expect(dependencies.readCookie).toHaveBeenCalledOnce();
    const [url, options] = request.mock.calls[0];
    expect(url).toBe("https://api.bilibili.com/x/web-interface/archive/like");
    expect(options?.method).toBe("POST");
    expect(options?.credentials).toBe("omit");
    const headers = new Headers(options?.headers);
    expect(headers.get("cookie")).toBe(cookie);
    expect(headers.get("content-type")).toBe("application/x-www-form-urlencoded");
    expect(headers.get("referer")).toBe(`https://www.bilibili.com/video/${video.bvid}/`);
    expect(headers.has("sec-fetch-mode")).toBe(false);
    expect(Object.fromEntries(new URLSearchParams(String(options?.body)))).toEqual({
      aid: video.aid,
      like: liked ? "1" : "2",
      from_spmid: "333.1007.tianma.2-1-3.click",
      spmid: "333.788.0.0",
      statistics: '{"appId":100,"platform":5}',
      eab_x: "2",
      ramval: "159",
      source: "web_normal",
      ga: "1",
      csrf: "a+b/==",
    });
  });
});

describe("video like safety", () => {
  test.each([null, "", "SESSDATA=x", "SESSDATA=x; DedeUserID=123"])(
    "blocks missing login or CSRF credentials: %s",
    async (value) => {
      const { request, dependencies } = setup(value);
      await expect(
        modifyVideoLike(account, { video, liked: true }, dependencies),
      ).rejects.toBeInstanceOf(VideoLikeLoginRequiredError);
      expect(request).not.toHaveBeenCalled();
    },
  );

  test("rejects another account's credentials", async () => {
    const { request, dependencies } = setup("SESSDATA=x; DedeUserID=456; bili_jct=x");
    await expect(
      modifyVideoLike(account, { video, liked: true }, dependencies),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    expect(request).not.toHaveBeenCalled();
  });

  test.each(["0", "-1", "bad", "9007199254740993"])("rejects invalid aid %s", async (aid) => {
    const { request, dependencies } = setup();
    await expect(
      modifyVideoLike(account, { video: { ...video, aid }, liked: true }, dependencies),
    ).rejects.toThrow("ID 无效");
    expect(request).not.toHaveBeenCalled();
  });

  test.each([-101, -111])("requires login for code %s", async (code) => {
    const { request, dependencies } = setup();
    request.mockResolvedValue(Response.json({ code }));
    await expect(
      modifyVideoLike(account, { video, liked: true }, dependencies),
    ).rejects.toBeInstanceOf(VideoLikeLoginRequiredError);
  });

  test.each([65004, 65006])(
    "requests reconciliation when remote like state differs (code %s)",
    async (code) => {
      const { request, dependencies } = setup();
      request.mockResolvedValue(Response.json({ code }));
      await expect(
        modifyVideoLike(account, { video, liked: true }, dependencies),
      ).rejects.toBeInstanceOf(VideoLikeResultUnknownError);
    },
  );

  test("reports a business rejection and never retries it", async () => {
    const { request, dependencies } = setup();
    request.mockResolvedValue(Response.json({ code: -403, message: "操作被拒绝" }));
    await expect(modifyVideoLike(account, { video, liked: true }, dependencies)).rejects.toThrow(
      "操作被拒绝",
    );
    expect(request).toHaveBeenCalledOnce();
  });

  test.each([
    () => Response.json(success, { status: 503 }),
    () => Response.json({ code: "0" }),
    () => Response.json({ message: "OK" }),
    () => new Response("not json"),
  ])("marks an HTTP/malformed response uncertain without retrying", async (createResponse) => {
    const { request, dependencies } = setup();
    request.mockResolvedValue(createResponse());
    await expect(
      modifyVideoLike(account, { video, liked: true }, dependencies),
    ).rejects.toBeInstanceOf(VideoLikeResultUnknownError);
    expect(request).toHaveBeenCalledOnce();
  });

  test("marks a network failure uncertain", async () => {
    const { request, dependencies } = setup();
    request.mockRejectedValue(new Error("offline"));
    await expect(
      modifyVideoLike(account, { video, liked: true }, dependencies),
    ).rejects.toBeInstanceOf(VideoLikeResultUnknownError);
    expect(request).toHaveBeenCalledOnce();
  });

  test.each(["credentials", "response", "body"])(
    "discards an account change during %s",
    async (phase) => {
      const { request, dependencies } = setup();
      let current = true;
      dependencies.isCurrentAccount = () => current;
      if (phase === "credentials")
        dependencies.readCookie = async () => {
          current = false;
          return cookie;
        };
      if (phase === "response")
        request.mockImplementation(async () => {
          current = false;
          return Response.json(success);
        });
      if (phase === "body") {
        const response = Response.json(success);
        vi.spyOn(response, "json").mockImplementation(async () => {
          current = false;
          return success;
        });
        request.mockResolvedValue(response);
      }
      await expect(
        modifyVideoLike(account, { video, liked: true }, dependencies),
      ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
      if (phase === "credentials") expect(request).not.toHaveBeenCalled();
    },
  );

  test("aborts at 15 seconds and does not retry", async () => {
    vi.useFakeTimers();
    const { request, dependencies } = setup();
    request.mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const result = expect(
      modifyVideoLike(account, { video, liked: true }, dependencies),
    ).rejects.toThrow("超时");
    await vi.advanceTimersByTimeAsync(15000);
    await result;
    expect(request).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
