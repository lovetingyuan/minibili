import { afterEach, describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  DANMAKU_MAX_LENGTH,
  DanmakuLoginRequiredError,
  DanmakuSendResultUnknownError,
  resolveDanmakuText,
  sendVideoDanmaku,
} from "./send-danmaku";
import type { DanmakuSendRequest, DanmakuSendRequestDependencies } from "./send-danmaku.types";

const account = { mid: "123", generation: 1 };
const video = { aid: "116378950441190", bvid: "BV1VeQFBDEC2" };
const cookie = "SESSDATA=test-session; DedeUserID=123; bili_jct=a+b/==; buvid3=test-device";
const request: DanmakuSendRequest = {
  video,
  cid: 1103612055,
  text: "  你好世界  ",
  progressMs: 12345.4,
};
const success = { code: 0, message: "OK", data: { dmid_str: "12345678901234567" } };

function setup(
  options: {
    response?: unknown;
    cookie?: string | null;
    current?: () => boolean;
  } = {},
) {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json(options.response ?? success));
  vi.stubGlobal("fetch", fetchMock);
  const dependencies: DanmakuSendRequestDependencies = {
    readCookie: vi.fn(async (): Promise<string | null> =>
      "cookie" in options ? (options.cookie ?? null) : cookie,
    ),
    isCurrentAccount: vi.fn(options.current ?? (() => true)),
  };
  return { fetchMock, dependencies };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("sendVideoDanmaku request", () => {
  test("posts the web player's rolling danmaku form without a data field", async () => {
    const { fetchMock, dependencies } = setup();
    await expect(sendVideoDanmaku(account, request, dependencies)).resolves.toEqual({
      dmid: "12345678901234567",
      text: "你好世界",
      progressMs: 12346,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(dependencies.readCookie).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.bilibili.com/x/v2/dm/post");
    expect(options?.method).toBe("POST");
    expect(options?.credentials).toBe("omit");
    const headers = new Headers(options?.headers);
    expect(headers.get("cookie")).toBe(cookie);
    expect(headers.get("content-type")).toBe("application/x-www-form-urlencoded");
    expect(headers.get("referer")).toBe(`https://www.bilibili.com/video/${video.bvid}/`);
    expect(headers.get("origin")).toBe("https://www.bilibili.com");
    // 防止把 Cookie 带成需要预检的请求头组合
    expect(headers.has("sec-fetch-mode")).toBe(false);
    const body = Object.fromEntries(new URLSearchParams(String(options?.body)));
    expect(body.rnd).toMatch(/^\d{13}$/);
    delete body.rnd;
    expect(body).toEqual({
      type: "1",
      oid: String(request.cid),
      msg: "你好世界",
      aid: video.aid,
      // 毫秒进度向上取整
      progress: "12346",
      plat: "1",
      color: "16777215",
      fontsize: "25",
      pool: "0",
      mode: "1",
      checkbox_type: "0",
      gaiasource: "main_web",
      spmid: "333.788.0.0",
      from_spmid: "333.1007.tianma.2-1-3.click",
      statistics: '{"appId":100,"platform":5}',
      csrf: "a+b/==",
    });
  });
});

describe("sendVideoDanmaku safety", () => {
  test.each([null, "", "SESSDATA=x", "SESSDATA=x; DedeUserID=123"])(
    "blocks missing login or CSRF credentials: %s",
    async (value) => {
      const { fetchMock, dependencies } = setup({ cookie: value });
      await expect(sendVideoDanmaku(account, request, dependencies)).rejects.toBeInstanceOf(
        DanmakuLoginRequiredError,
      );
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  test("rejects another account's credentials", async () => {
    const { fetchMock, dependencies } = setup({
      cookie: "SESSDATA=x; DedeUserID=456; bili_jct=x",
    });
    await expect(sendVideoDanmaku(account, request, dependencies)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("stops when the session changed while the request was in flight", async () => {
    let calls = 0;
    const { dependencies } = setup({
      current: () => {
        calls += 1;
        return calls === 1;
      },
    });
    await expect(sendVideoDanmaku(account, request, dependencies)).rejects.toBeInstanceOf(
      BilibiliSessionChangedError,
    );
  });

  test.each([
    ["", "请输入弹幕内容"],
    ["   ", "请输入弹幕内容"],
    ["第一行\n第二行", "弹幕内容不能包含换行"],
  ])("rejects invalid text %j before requesting", async (text, message) => {
    const { fetchMock, dependencies } = setup();
    await expect(sendVideoDanmaku(account, { ...request, text }, dependencies)).rejects.toThrow(
      message,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("rejects text longer than the limit", async () => {
    const { fetchMock, dependencies } = setup();
    await expect(
      sendVideoDanmaku(
        account,
        { ...request, text: "字".repeat(DANMAKU_MAX_LENGTH + 1) },
        dependencies,
      ),
    ).rejects.toThrow(`不能超过 ${DANMAKU_MAX_LENGTH} 个字符`);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test.each([
    [{ cid: 0 }, "分P 信息无效，请重新打开视频"],
    [{ cid: 1.5 }, "分P 信息无效，请重新打开视频"],
    [{ video: { ...video, aid: "abc" } }, "视频 ID 无效，请重新打开视频"],
    [{ video: { ...video, bvid: "" } }, "视频 ID 无效，请重新打开视频"],
    [{ progressMs: -1 }, "播放进度无效，请重新发送弹幕"],
  ])("rejects an invalid request %j before requesting", async (patch, message) => {
    const { fetchMock, dependencies } = setup();
    await expect(sendVideoDanmaku(account, { ...request, ...patch }, dependencies)).rejects.toThrow(
      message,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("sendVideoDanmaku response", () => {
  test.each([-8, -101, -111])("treats code %i as a login problem", async (code) => {
    const { dependencies } = setup({ response: { code, message: "invalid" } });
    await expect(sendVideoDanmaku(account, request, dependencies)).rejects.toBeInstanceOf(
      DanmakuLoginRequiredError,
    );
  });

  test.each([
    [-636, "您发送弹幕的频率过快，请稍后再试"],
    [-638, "您已经被禁言，不能发送弹幕"],
    [-641, "您的弹幕长度大于100"],
    [36711, "弹幕系统升级中，请稍后再试"],
  ])("maps the official message for code %i", async (code, message) => {
    const { dependencies } = setup({ response: { code, message: "raw" } });
    await expect(sendVideoDanmaku(account, request, dependencies)).rejects.toThrow(message);
  });

  test("falls back to the server message for unknown codes", async () => {
    const { dependencies } = setup({ response: { code: -999, message: "未知错误" } });
    await expect(sendVideoDanmaku(account, request, dependencies)).rejects.toThrow(
      "弹幕发送失败（-999）：未知错误",
    );
  });

  test("fails when the response has no danmaku id", async () => {
    const { dependencies } = setup({ response: { code: 0, message: "", data: {} } });
    await expect(sendVideoDanmaku(account, request, dependencies)).rejects.toThrow(
      "弹幕发送失败，请稍后重试",
    );
  });

  test("reports an unknown result for a failed transport", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);
    const dependencies: DanmakuSendRequestDependencies = {
      readCookie: vi.fn(async () => cookie),
      isCurrentAccount: vi.fn(() => true),
    };
    await expect(sendVideoDanmaku(account, request, dependencies)).rejects.toBeInstanceOf(
      DanmakuSendResultUnknownError,
    );
  });

  test("reports an unknown result when the request times out", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(
        (_url, options) =>
          new Promise<Response>((_resolve, reject) => {
            options?.signal?.addEventListener("abort", () => {
              reject(new Error("aborted"));
            });
          }),
      ),
    );
    const dependencies: DanmakuSendRequestDependencies = {
      readCookie: vi.fn(async () => cookie),
      isCurrentAccount: vi.fn(() => true),
    };
    const assertion = expect(sendVideoDanmaku(account, request, dependencies)).rejects.toThrow(
      "发送弹幕超时",
    );
    await vi.advanceTimersByTimeAsync(15000);
    await assertion;
  });
});

describe("resolveDanmakuText", () => {
  test("trims the content and keeps a full length message", () => {
    expect(resolveDanmakuText("  你好  ")).toBe("你好");
    expect(resolveDanmakuText("字".repeat(DANMAKU_MAX_LENGTH))).toHaveLength(DANMAKU_MAX_LENGTH);
  });
});
