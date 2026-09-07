import { afterEach, describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  DynamicLikeLoginRequiredError,
  DynamicLikeResultUnknownError,
  modifyDynamicLike,
} from "./dynamic-like";
import type { DynamicLikeRequestDependencies } from "./dynamic-like.types";

const account = { mid: "123", generation: 1 };
const change = { dynamicId: "967717348014293017", liked: true };
const cookie = "SESSDATA=test-session; DedeUserID=123; bili_jct=a+b/==; buvid3=test-device";
const success = { code: 0, message: "0", ttl: 1 };

function setup(value: string | null = cookie) {
  const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json(success));
  vi.stubGlobal("fetch", request);
  const dependencies: DynamicLikeRequestDependencies = {
    readCookie: vi.fn(async () => value),
    isCurrentAccount: vi.fn(() => true),
  };
  return { request, dependencies };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe.each([true, false])("dynamic like request liked=%s", (liked) => {
  test("sends JSON with the current dynamic and a single Cookie/CSRF snapshot", async () => {
    const { request, dependencies } = setup();
    const expected = { ...change, liked };

    await expect(modifyDynamicLike(account, expected, dependencies)).resolves.toEqual(expected);

    expect(request).toHaveBeenCalledOnce();
    expect(dependencies.readCookie).toHaveBeenCalledOnce();
    const [url, options] = request.mock.calls[0];
    expect(url).toBe("https://api.bilibili.com/x/dynamic/feed/dyn/thumb?csrf=a%2Bb%2F%3D%3D");
    expect(options?.method).toBe("POST");
    expect(options?.credentials).toBe("omit");
    const headers = new Headers(options?.headers);
    expect(headers.get("cookie")).toBe(cookie);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("referer")).toBe(`https://www.bilibili.com/opus/${change.dynamicId}`);
    expect(JSON.parse(String(options?.body))).toEqual({
      dyn_id_str: change.dynamicId,
      up: liked ? 1 : 2,
    });
  });
});

describe("dynamic like safety", () => {
  test.each([null, "", "SESSDATA=x", "SESSDATA=x; DedeUserID=123"])(
    "blocks missing login or CSRF credentials: %s",
    async (value) => {
      const { request, dependencies } = setup(value);
      await expect(modifyDynamicLike(account, change, dependencies)).rejects.toBeInstanceOf(
        DynamicLikeLoginRequiredError,
      );
      expect(request).not.toHaveBeenCalled();
    },
  );

  test("rejects another account's credentials", async () => {
    const { request, dependencies } = setup("SESSDATA=x; DedeUserID=456; bili_jct=x");
    await expect(modifyDynamicLike(account, change, dependencies)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    expect(request).not.toHaveBeenCalled();
  });

  test.each(["0", "-1", "bad"])("rejects invalid dynamic id %s", async (dynamicId) => {
    const { request, dependencies } = setup();
    await expect(
      modifyDynamicLike(account, { ...change, dynamicId }, dependencies),
    ).rejects.toThrow("动态 ID 无效");
    expect(request).not.toHaveBeenCalled();
  });

  test.each([-101, -111])("requires login for code %s", async (code) => {
    const { request, dependencies } = setup();
    request.mockResolvedValue(Response.json({ code }));
    await expect(modifyDynamicLike(account, change, dependencies)).rejects.toBeInstanceOf(
      DynamicLikeLoginRequiredError,
    );
  });

  test("reports a business rejection", async () => {
    const { request, dependencies } = setup();
    request.mockResolvedValue(Response.json({ code: -403, message: "操作被拒绝" }));
    await expect(modifyDynamicLike(account, change, dependencies)).rejects.toThrow("操作被拒绝");
    expect(request).toHaveBeenCalledOnce();
  });

  test.each([
    () => Response.json(success, { status: 503 }),
    () => Response.json({ code: "0" }),
    () => new Response("not json"),
  ])("marks an HTTP/malformed response uncertain", async (createResponse) => {
    const { request, dependencies } = setup();
    request.mockResolvedValue(createResponse());
    await expect(modifyDynamicLike(account, change, dependencies)).rejects.toBeInstanceOf(
      DynamicLikeResultUnknownError,
    );
    expect(request).toHaveBeenCalledOnce();
  });

  test("marks a network failure uncertain", async () => {
    const { request, dependencies } = setup();
    request.mockRejectedValue(new Error("offline"));
    await expect(modifyDynamicLike(account, change, dependencies)).rejects.toBeInstanceOf(
      DynamicLikeResultUnknownError,
    );
    expect(request).toHaveBeenCalledOnce();
  });
});
