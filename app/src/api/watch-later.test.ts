import { afterEach, describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  fetchBilibiliWatchLater,
  getProgressRatio,
  getWatchLaterKey,
  getWatchLaterListItems,
  modifyWatchLater,
  WatchLaterLoginRequiredError,
  WatchLaterResultUnknownError,
} from "./watch-later";
import { WatchLaterResponseSchema } from "./watch-later.schema";
import type { WatchLaterItem, WatchLaterRequest, WatchLaterResponse } from "./watch-later.types";

const account = { mid: "123", generation: 4 };
const cookie = "SESSDATA=abc; DedeUserID=123; bili_jct=token";
const record: WatchLaterItem = {
  aid: 117171959238719,
  bvid: "BV1eVtc6hEhn",
  title: "看了10年网络热门生物",
  pic: "http://i1.hdslb.com/bfs/archive/e441244.jpg",
  duration: 734,
  progress: 15,
  viewed: false,
  owner: { mid: 946974, name: "影视飓风", face: "https://i0.hdslb.com/bfs/face/abc.jpg" },
  stat: { view: 6500107, danmaku: 18809 },
};

function response(items = [record]): WatchLaterResponse {
  return WatchLaterResponseSchema.parse({ count: items.length, list: items });
}

function mockFetch(result: unknown, ok = true) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({
    ok,
    status: ok ? 200 : 500,
    json: async () => result,
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("Bilibili watch later list", () => {
  test("requests the web toview list and parses the response", async () => {
    const request = vi.fn<WatchLaterRequest>().mockResolvedValue(response());
    const data = await fetchBilibiliWatchLater(account, request, () => true);
    expect(request).toHaveBeenCalledExactlyOnceWith(
      "/x/v2/history/toview/web?web_location=333.1007",
    );
    expect(data.count).toBe(1);
    expect(getWatchLaterKey(account)).toEqual(["bilibili-watch-later", "123", 4]);
  });

  test("maps records into playable cards carrying the watched progress", () => {
    const [item] = getWatchLaterListItems(response());
    expect(item.key).toBe("117171959238719");
    expect(item.aid).toBe("117171959238719");
    expect(item.title).toBe("看了10年网络热门生物");
    expect(item.progressRatio).toBeCloseTo(15 / 734);
    expect(item.video).toMatchObject({
      bvid: "BV1eVtc6hEhn",
      aid: "117171959238719",
      title: "看了10年网络热门生物",
      cover: "http://i1.hdslb.com/bfs/archive/e441244.jpg",
      duration: 734,
      mid: 946974,
      name: "影视飓风",
      play: 6500107,
      danmaku: 18809,
    });
  });

  test("keeps unavailable and duplicated records usable", () => {
    const items = getWatchLaterListItems(
      response([
        record,
        record,
        { ...record, aid: 42, bvid: "", title: "" },
        {
          ...record,
          aid: 43,
          bvid: null,
          title: null,
          duration: null,
          progress: null,
          owner: null,
          stat: null,
        },
      ]),
    );
    expect(items.map((item) => item.aid)).toEqual([
      "117171959238719",
      "42",
      "43",
    ]);
    expect(items[1]).toMatchObject({ title: "不可用的视频", video: null });
    expect(items[1].progressRatio).toBeCloseTo(15 / 734);
    expect(items[2]).toMatchObject({ title: "不可用的视频", video: null, progressRatio: 0 });
    expect(getWatchLaterListItems(undefined)).toEqual([]);
  });

  test("computes the progress ratio boundaries", () => {
    expect(getProgressRatio(15, 734, false)).toBeCloseTo(15 / 734);
    expect(getProgressRatio(734, 734, false)).toBe(1);
    expect(getProgressRatio(900, 734, false)).toBe(1);
    expect(getProgressRatio(0, 734, false)).toBe(0);
    expect(getProgressRatio(0, 0, false)).toBe(0);
    expect(getProgressRatio(0, 0, true)).toBe(1);
    expect(getProgressRatio(10, 100, true)).toBe(1);
  });

  test("rejects results that arrive after the account changed", async () => {
    const request = vi.fn<WatchLaterRequest>().mockResolvedValue(response());
    let current = true;
    const task = fetchBilibiliWatchLater(account, request, () => current);
    current = false;
    await expect(task).rejects.toBeInstanceOf(BilibiliSessionChangedError);
  });

  test("reports expired credentials instead of an empty list", async () => {
    const request = vi
      .fn<WatchLaterRequest>()
      .mockRejectedValue(Object.assign(new Error("账号未登录"), { code: -101 }));
    await expect(fetchBilibiliWatchLater(account, request, () => true)).rejects.toBeInstanceOf(
      WatchLaterLoginRequiredError,
    );
  });
});

describe("Bilibili watch later mutations", () => {
  test("adds a video with csrf and the login cookie", async () => {
    const fetchMock = mockFetch({ code: 0, message: "OK", ttl: 1 });
    const change = { aid: "117171959238719", added: true };
    await expect(
      modifyWatchLater(account, change, { readCookie: async () => cookie, isCurrentAccount: () => true }),
    ).resolves.toEqual(change);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.bilibili.com/x/v2/history/toview/add");
    expect(init?.method).toBe("POST");
    expect(String(init?.body)).toBe("aid=117171959238719&csrf=token");
    expect(new Headers(init?.headers).get("cookie")).toBe(cookie);
    expect(new Headers(init?.headers).get("content-type")).toBe(
      "application/x-www-form-urlencoded",
    );
  });

  test("removes a video through the del endpoint", async () => {
    const fetchMock = mockFetch({ code: 0, message: "OK", ttl: 1 });
    await modifyWatchLater(
      account,
      { aid: "42", added: false },
      { readCookie: async () => cookie, isCurrentAccount: () => true },
    );
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.bilibili.com/x/v2/history/toview/del");
    expect(String(fetchMock.mock.calls[0][1]?.body)).toBe("aid=42&csrf=token");
  });

  test("maps server codes into actionable errors", async () => {
    mockFetch({ code: -101, message: "账号未登录" });
    await expect(
      modifyWatchLater(
        account,
        { aid: "42", added: true },
        { readCookie: async () => cookie, isCurrentAccount: () => true },
      ),
    ).rejects.toBeInstanceOf(WatchLaterLoginRequiredError);

    mockFetch({ code: -400, message: "请求错误" });
    await expect(
      modifyWatchLater(
        account,
        { aid: "42", added: true },
        { readCookie: async () => cookie, isCurrentAccount: () => true },
      ),
    ).rejects.toThrowError("添加稍后再看失败（-400）：请求错误");
  });

  test("reports an unknown result when the response never arrives", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    await expect(
      modifyWatchLater(
        account,
        { aid: "42", added: false },
        { readCookie: async () => cookie, isCurrentAccount: () => true },
      ),
    ).rejects.toBeInstanceOf(WatchLaterResultUnknownError);
  });

  test("validates the video id, credentials and the current account", async () => {
    const dependencies = { readCookie: async () => cookie, isCurrentAccount: () => true };
    await expect(
      modifyWatchLater(account, { aid: "abc", added: true }, dependencies),
    ).rejects.toThrowError("视频 ID 无效，请重新打开视频");

    await expect(
      modifyWatchLater(
        account,
        { aid: "42", added: true },
        { readCookie: async () => null, isCurrentAccount: () => true },
      ),
    ).rejects.toBeInstanceOf(WatchLaterLoginRequiredError);

    await expect(
      modifyWatchLater(
        account,
        { aid: "42", added: true },
        { readCookie: async () => "SESSDATA=abc; DedeUserID=123", isCurrentAccount: () => true },
      ),
    ).rejects.toBeInstanceOf(WatchLaterLoginRequiredError);

    await expect(
      modifyWatchLater(
        account,
        { aid: "42", added: true },
        { readCookie: async () => "SESSDATA=abc; DedeUserID=999; bili_jct=token", isCurrentAccount: () => true },
      ),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);

    await expect(
      modifyWatchLater(
        account,
        { aid: "42", added: true },
        { readCookie: async () => cookie, isCurrentAccount: () => false },
      ),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
  });
});
