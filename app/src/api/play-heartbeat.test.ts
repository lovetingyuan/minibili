import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import {
  createPlayHeartbeatSession,
  PlayHeartbeatLoginRequiredError,
  PLAY_HEARTBEAT_TIMEOUT_MS,
  reportPlayHeartbeat,
  reportPlayStart,
} from "./play-heartbeat";
import type {
  PlayHeartbeatReport,
  PlayHeartbeatRequestDependencies,
  PlayHeartbeatSession,
  PlayHeartbeatVideo,
} from "./play-heartbeat.types";

const account = { mid: "123", generation: 1 };
const video: PlayHeartbeatVideo = {
  aid: "1501398719",
  bvid: "BV1HS421w7wG",
  cid: 1458260037,
  page: 1,
};
const session: PlayHeartbeatSession = {
  session: "0123456789abcdef0123456789abcdef",
  startTs: 1789486330,
  maxPlayedTime: 120,
};
const report: PlayHeartbeatReport = {
  type: 0,
  playedTime: 120,
  realPlayedTime: 45,
  videoDuration: 568,
  quality: 80,
};
const cookie = "SESSDATA=test-session; DedeUserID=123; bili_jct=a+b/==; buvid3=test-device";
const success = { code: 0, message: "0", ttl: 1 };
// 与线上一致的 wbi key：签名结果可以被固化成回归用例
const wbiKeys = {
  img_url: "https://i0.hdslb.com/bfs/wbi/7cd084941338484aae1ad9425b84077c.png",
  sub_url: "https://i0.hdslb.com/bfs/wbi/4932caff0ff746eab6f01bf08b70ac45.png",
};
const HEARTBEAT_URL = "https://api.bilibili.com/x/click-interface/web/heartbeat";
const PLAY_START_URL = "https://api.bilibili.com/x/click-interface/click/web/h5";

function setup(value: string | null = cookie) {
  const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json(success));
  vi.stubGlobal("fetch", request);
  const dependencies: PlayHeartbeatRequestDependencies = {
    readCookie: vi.fn(async () => value),
    isCurrentAccount: vi.fn(() => true),
    getWbiKeys: vi.fn(async () => wbiKeys),
  };
  return { request, dependencies };
}

/** 取出唯一的请求并按注册顺序返回 URL 与表单 body */
function readRequest(request: ReturnType<typeof setup>["request"]) {
  expect(request).toHaveBeenCalledOnce();
  const [url, options] = request.mock.calls[0];
  return {
    url,
    options,
    headers: new Headers(options?.headers),
    body: Object.fromEntries(new URLSearchParams(String(options?.body))),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  // 固定系统时间，wbi 的 wts 与 w_rid 才是可断言的
  vi.setSystemTime(1789486400_000);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("play heartbeat request", () => {
  test("signs the periodic heartbeat query and posts the matching form", async () => {
    const { request, dependencies } = setup();
    await reportPlayHeartbeat(account, video, session, report, dependencies);
    const { url, options, headers, body } = readRequest(request);
    expect(url).toBe(
      `${HEARTBEAT_URL}?w_aid=1501398719&w_dt=2&w_last_play_progress_time=120&w_mid=123` +
        `&w_played_time=120&w_real_played_time=45&w_realtime=45&w_start_ts=1789486330` +
        `&w_video_duration=568&web_location=1315873&wts=1789486400` +
        `&w_rid=c7039ca47b1a7fcfa662739e1bc2b992`,
    );
    expect(options?.method).toBe("POST");
    expect(options?.credentials).toBe("omit");
    expect(headers.get("cookie")).toBe(cookie);
    expect(headers.get("content-type")).toBe("application/x-www-form-urlencoded");
    expect(headers.get("origin")).toBe("https://www.bilibili.com");
    expect(headers.get("referer")).toBe(`https://www.bilibili.com/video/${video.bvid}/`);
    expect(body).toEqual({
      start_ts: "1789486330",
      mid: "123",
      aid: "1501398719",
      cid: "1458260037",
      type: "3",
      sub_type: "0",
      dt: "2",
      play_type: "0",
      realtime: "45",
      played_time: "120",
      real_played_time: "45",
      refer_url: "",
      quality: "80",
      is_auto_qn: "1",
      video_duration: "568",
      last_play_progress_time: "120",
      max_play_progress_time: "120",
      outer: "0",
      statistics: '{"appId":100,"platform":5}',
      mobi_app: "web",
      device: "web",
      platform: "web",
      cur_language_vt: "{}",
      perfer_type: "{}",
      play_mode: "1",
      spmid: "333.788.0.0",
      from_spmid: "333.788.0.0",
      session: session.session,
      track_id: "",
      extra: '{"play_method":2}',
      csrf: "a+b/==",
    });
  });

  test("signs the play-start request with part and page timestamps", async () => {
    const { request, dependencies } = setup();
    await reportPlayStart(account, video, session, dependencies);
    const { url, headers, body } = readRequest(request);
    expect(url).toBe(
      `${PLAY_START_URL}?w_aid=1501398719&w_ftime=1789486330&w_part=1&w_stime=1789486330` +
        `&w_type=3&web_location=1315873&wts=1789486400&w_rid=bf6b25080cca7be0677a0634f83ad64a`,
    );
    expect(headers.get("cookie")).toBe(cookie);
    expect(body).toEqual({
      mid: "123",
      aid: "1501398719",
      cid: "1458260037",
      part: "1",
      ftime: "1789486330",
      stime: "1789486330",
      type: "3",
      sub_type: "0",
      refer_url: "",
      outer: "0",
      statistics: '{"appId":100,"platform":5}',
      mobi_app: "web",
      device: "web",
      platform: "web",
      cur_language: "",
      perfer_type: "",
      play_mode: "1",
      spmid: "333.788.0.0",
      from_spmid: "333.788.0.0",
      session: session.session,
      track_id: "",
      extra: '{"play_method":2}',
      csrf: "a+b/==",
    });
  });

  test.each([
    [1, 0, 0],
    [2, 120, 45],
    [3, 120, 45],
  ] as const)("reports play_type %s with the played position", async (type, played, real) => {
    const { request, dependencies } = setup();
    await reportPlayHeartbeat(
      account,
      video,
      session,
      { ...report, type, playedTime: played, realPlayedTime: real },
      dependencies,
    );
    const { body } = readRequest(request);
    expect(body.play_type).toBe(String(type));
    expect(body.played_time).toBe(String(played));
    expect(body.realtime).toBe(String(real));
    expect(body.real_played_time).toBe(String(real));
    expect(body.last_play_progress_time).toBe(String(Math.max(played, 0)));
  });

  test("marks the video as finished with played_time=-1 and the full duration", async () => {
    const { request, dependencies } = setup();
    await reportPlayHeartbeat(
      account,
      video,
      session,
      { ...report, type: 4, playedTime: -1, videoDuration: 567 },
      dependencies,
    );
    const { body } = readRequest(request);
    expect(body.play_type).toBe("4");
    expect(body.played_time).toBe("-1");
    expect(body.video_duration).toBe("567");
    expect(body.last_play_progress_time).toBe("567");
    expect(body.max_play_progress_time).toBe("567");
  });

  test("keeps the maximum progress reached in the session", async () => {
    const { request, dependencies } = setup();
    await reportPlayHeartbeat(
      account,
      video,
      { ...session, maxPlayedTime: 300 },
      { ...report, playedTime: 120 },
      dependencies,
    );
    const { body } = readRequest(request);
    expect(body.played_time).toBe("120");
    expect(body.max_play_progress_time).toBe("300");
  });
});

describe("play heartbeat safety", () => {
  test.each([null, "", "SESSDATA=x", "SESSDATA=x; DedeUserID=123"])(
    "blocks missing login or CSRF credentials: %s",
    async (value) => {
      const { request, dependencies } = setup(value);
      await expect(
        reportPlayHeartbeat(account, video, session, report, dependencies),
      ).rejects.toBeInstanceOf(PlayHeartbeatLoginRequiredError);
      expect(request).not.toHaveBeenCalled();
    },
  );

  test("rejects another account's credentials", async () => {
    const { request, dependencies } = setup("SESSDATA=x; DedeUserID=456; bili_jct=x");
    await expect(
      reportPlayHeartbeat(account, video, session, report, dependencies),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    expect(request).not.toHaveBeenCalled();
  });

  test("skips the request when the session changed while reading the cookie", async () => {
    const { request, dependencies } = setup();
    let current = true;
    dependencies.isCurrentAccount = () => current;
    dependencies.readCookie = async () => {
      current = false;
      return cookie;
    };
    await expect(
      reportPlayHeartbeat(account, video, session, report, dependencies),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    expect(request).not.toHaveBeenCalled();
    expect(dependencies.getWbiKeys).not.toHaveBeenCalled();
  });

  test.each([-101, -111])("requires login for code %s", async (code) => {
    const { request, dependencies } = setup();
    request.mockResolvedValue(Response.json({ code }));
    await expect(
      reportPlayHeartbeat(account, video, session, report, dependencies),
    ).rejects.toBeInstanceOf(PlayHeartbeatLoginRequiredError);
  });

  test("reports a business rejection without retrying", async () => {
    const { request, dependencies } = setup();
    request.mockResolvedValue(Response.json({ code: -403, message: "被拒绝" }));
    await expect(
      reportPlayHeartbeat(account, video, session, report, dependencies),
    ).rejects.toThrow("被拒绝");
    expect(request).toHaveBeenCalledOnce();
  });

  test.each([
    () => Response.json(success, { status: 503 }),
    () => Response.json({ code: "0" }),
    () => Response.json({ message: "OK" }),
    () => new Response("not json"),
  ])("rejects an HTTP/malformed response without retrying", async (createResponse) => {
    const { request, dependencies } = setup();
    request.mockResolvedValue(createResponse());
    await expect(
      reportPlayHeartbeat(account, video, session, report, dependencies),
    ).rejects.toThrow();
    expect(request).toHaveBeenCalledOnce();
  });

  test("aborts at 10 seconds and does not retry", async () => {
    const { request, dependencies } = setup();
    request.mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const result = expect(
      reportPlayHeartbeat(account, video, session, report, dependencies),
    ).rejects.toThrow("aborted");
    await vi.advanceTimersByTimeAsync(PLAY_HEARTBEAT_TIMEOUT_MS);
    await result;
    expect(request).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("play heartbeat session", () => {
  test("creates a 32 hex session id with the current start time and resume position", () => {
    const created = createPlayHeartbeatSession(1789486400_800, 213.6);
    expect(created.session).toMatch(/^[0-9a-f]{32}$/);
    expect(created.startTs).toBe(1789486400);
    expect(created.maxPlayedTime).toBe(214);
  });

  test("starts from the beginning when the position is unknown", () => {
    const created = createPlayHeartbeatSession(1789486400_000, -12);
    expect(created.maxPlayedTime).toBe(0);
    expect(createPlayHeartbeatSession(1789486400_000).session).not.toBe(created.session);
  });
});
