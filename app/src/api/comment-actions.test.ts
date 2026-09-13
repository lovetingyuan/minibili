import { afterEach, describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import type { BilibiliAccount } from "../features/bilibili-session/types";

import {
  addCommentReply,
  CommentLoginRequiredError,
  CommentResultUnknownError,
  modifyCommentAttitude,
} from "./comment-actions";
import type { CommentRequestDependencies, CommentTarget } from "./comment-actions.types";

const account: BilibiliAccount = {
  mid: "123",
  generation: 1,
  profile: { mid: 123, name: "tester", face: "", follower: 0 },
};
const cookie = "SESSDATA=session; DedeUserID=123; bili_jct=a+b/==; buvid3=device";
const sourceUrl = "https://www.bilibili.com/video/BV1test/";
const target: CommentTarget = {
  id: "456",
  mid: "789",
  name: "author",
  oid: "1000",
  root: "0",
  type: 1,
};

function createReply() {
  return {
    action: 0 as const,
    content: { message: "new reply" },
    count: 0,
    ctime: 0,
    invisible: false,
    like: 0,
    member: {
      avatar: "",
      is_senior_member: 0 as const,
      level_info: { current_level: 1, current_min: 0, current_exp: 0, next_exp: 1 },
      mid: "123",
      rank: "10000",
      sex: "保密",
      sign: "",
      uname: "tester",
    },
    mid: 123,
    oid: 1000,
    parent: 456,
    parent_str: "456",
    rcount: 0,
    reply_control: { time_desc: "刚刚" },
    root: 456,
    root_str: "456",
    rpid: 999,
    rpid_str: "999",
    state: 0,
    type: 1,
    up_action: { like: false, reply: false },
  };
}

function setup(payload: unknown = { code: 0, message: "OK", ttl: 1 }) {
  const request = vi.fn<typeof fetch>().mockImplementation(async () => Response.json(payload));
  vi.stubGlobal("fetch", request);
  const dependencies: CommentRequestDependencies = {
    readCookie: vi.fn(async () => cookie),
    isCurrentAccount: vi.fn(() => true),
  };
  return { request, dependencies };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe.each([
  ["like", "action"],
  ["dislike", "hate"],
] as const)("comment attitude %s", (kind, endpoint) => {
  test.each([true, false])("uses exact endpoint and action active=%s", async (active) => {
    const { request, dependencies } = setup();
    await modifyCommentAttitude(account, { target, kind, active, sourceUrl }, dependencies);
    expect(request).toHaveBeenCalledOnce();
    const [url, options] = request.mock.calls[0];
    expect(url).toBe(`https://api.bilibili.com/x/v2/reply/${endpoint}`);
    expect(new Headers(options?.headers).get("cookie")).toBe(cookie);
    expect(new Headers(options?.headers).get("referer")).toBe(sourceUrl);
    expect(Object.fromEntries(new URLSearchParams(String(options?.body)))).toEqual({
      oid: "1000",
      type: "1",
      rpid: "456",
      action: active ? "1" : "0",
      statistics: '{"appId":100,"platform":5}',
      csrf: "a+b/==",
    });
  });
});

test("replies to a root and a child with correct root/parent fields", async () => {
  const { request, dependencies } = setup({
    code: 0,
    message: "OK",
    data: { reply: createReply() },
  });
  await addCommentReply(account, { target, message: " hello ", sourceUrl }, dependencies);
  await addCommentReply(
    account,
    { target: { ...target, id: "789", root: "456" }, message: "child", sourceUrl },
    dependencies,
  );
  const firstBody = Object.fromEntries(new URLSearchParams(String(request.mock.calls[0][1]?.body)));
  const secondBody = Object.fromEntries(
    new URLSearchParams(String(request.mock.calls[1][1]?.body)),
  );
  expect(firstBody).toMatchObject({ message: "hello", root: "456", parent: "456", csrf: "a+b/==" });
  expect(secondBody).toMatchObject({ message: "child", root: "456", parent: "789" });
});

describe("comment mutation safety", () => {
  test("validates reply Unicode length before reading credentials", async () => {
    const { request, dependencies } = setup();
    await expect(
      addCommentReply(account, { target, message: "😀".repeat(1001), sourceUrl }, dependencies),
    ).rejects.toThrow("1000");
    expect(dependencies.readCookie).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  test.each([null, "", "SESSDATA=x", "SESSDATA=x; DedeUserID=123"])(
    "blocks missing login or csrf: %s",
    async (value) => {
      const { request, dependencies } = setup();
      dependencies.readCookie = vi.fn(async () => value);
      await expect(
        modifyCommentAttitude(
          account,
          { target, kind: "like", active: true, sourceUrl },
          dependencies,
        ),
      ).rejects.toBeInstanceOf(CommentLoginRequiredError);
      expect(request).not.toHaveBeenCalled();
    },
  );

  test("rejects a changed account before writing", async () => {
    const { request, dependencies } = setup();
    dependencies.readCookie = vi.fn(async () => cookie.replace("DedeUserID=123", "DedeUserID=321"));
    await expect(
      modifyCommentAttitude(
        account,
        { target, kind: "like", active: true, sourceUrl },
        dependencies,
      ),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
    expect(request).not.toHaveBeenCalled();
  });

  test("discards a response after the account generation changes", async () => {
    const { request, dependencies } = setup();
    let current = true;
    dependencies.isCurrentAccount = () => current;
    request.mockImplementation(async () => {
      current = false;
      return Response.json({ code: 0, message: "OK" });
    });
    await expect(
      modifyCommentAttitude(
        account,
        { target, kind: "like", active: true, sourceUrl },
        dependencies,
      ),
    ).rejects.toBeInstanceOf(BilibiliSessionChangedError);
  });

  test("reports a business rejection without retrying", async () => {
    const { request, dependencies } = setup({ code: -403, message: "操作被拒绝" });
    await expect(
      modifyCommentAttitude(
        account,
        { target, kind: "like", active: true, sourceUrl },
        dependencies,
      ),
    ).rejects.toThrow("操作被拒绝");
    expect(request).toHaveBeenCalledOnce();
  });

  test("reconciles when a successful reply response has no reply payload", async () => {
    const { request, dependencies } = setup({ code: 0, message: "OK", data: null });
    await expect(
      addCommentReply(account, { target, message: "hello", sourceUrl }, dependencies),
    ).rejects.toBeInstanceOf(CommentResultUnknownError);
    expect(request).toHaveBeenCalledOnce();
  });

  test.each([
    () => Response.json({ code: 0 }, { status: 503 }),
    () => Response.json({ code: "0" }),
    () => new Response("not json"),
  ])("marks malformed or HTTP responses uncertain without retrying", async (response) => {
    const { request, dependencies } = setup();
    request.mockResolvedValue(response());
    await expect(
      modifyCommentAttitude(
        account,
        { target, kind: "like", active: true, sourceUrl },
        dependencies,
      ),
    ).rejects.toBeInstanceOf(CommentResultUnknownError);
    expect(request).toHaveBeenCalledOnce();
  });

  test("marks a network failure uncertain", async () => {
    const { request, dependencies } = setup();
    request.mockRejectedValue(new Error("offline"));
    await expect(
      modifyCommentAttitude(
        account,
        { target, kind: "like", active: true, sourceUrl },
        dependencies,
      ),
    ).rejects.toBeInstanceOf(CommentResultUnknownError);
    expect(request).toHaveBeenCalledOnce();
  });

  test("aborts after 15 seconds and never retries", async () => {
    vi.useFakeTimers();
    const { request, dependencies } = setup();
    request.mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const result = expect(
      modifyCommentAttitude(
        account,
        { target, kind: "like", active: true, sourceUrl },
        dependencies,
      ),
    ).rejects.toThrow("超时");
    await vi.advanceTimersByTimeAsync(15000);
    await result;
    expect(request).toHaveBeenCalledOnce();
  });
});
