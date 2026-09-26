import { afterEach, describe, expect, test, vi } from "vitest";

import { BilibiliSessionChangedError } from "../features/bilibili-session/controller";
import type { BilibiliAccount } from "../features/bilibili-session/types";

import {
  addComment,
  addCommentReply,
  CommentLoginRequiredError,
  CommentResultUnknownError,
  deleteComment,
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

describe("top-level comment", () => {
  const input = { oid: "1000", type: 1, message: " 新评论 ", sourceUrl };

  test("posts the exact web payload without root and parent", async () => {
    const { request, dependencies } = setup({
      code: 0,
      message: "OK",
      data: { reply: createReply() },
    });
    const comment = await addComment(account, input, dependencies);
    expect(request).toHaveBeenCalledOnce();
    const [url, options] = request.mock.calls[0];
    const headers = new Headers(options?.headers);
    expect(url).toBe("https://api.bilibili.com/x/v2/reply/add");
    expect(options?.method).toBe("POST");
    expect(headers.get("cookie")).toBe(cookie);
    expect(headers.get("referer")).toBe(sourceUrl);
    expect(headers.get("origin")).toBe("https://www.bilibili.com");
    expect(headers.get("content-type")).toBe("application/x-www-form-urlencoded");
    expect(Object.fromEntries(new URLSearchParams(String(options?.body)))).toEqual({
      plat: "1",
      oid: "1000",
      type: "1",
      message: "新评论",
      at_name_to_mid: "{}",
      gaia_source: "main_web",
      statistics: '{"appId":100,"platform":5}',
      csrf: "a+b/==",
    });
    expect(comment).toMatchObject({ id: "999", oid: "1000", type: 1, root: "456", rcount: 0 });
  });

  test("validates the message before reading credentials", async () => {
    const { request, dependencies } = setup();
    await expect(addComment(account, { ...input, message: "   " }, dependencies)).rejects.toThrow(
      "请输入评论内容",
    );
    await expect(
      addComment(account, { ...input, message: "😀".repeat(1001) }, dependencies),
    ).rejects.toThrow("1000");
    expect(dependencies.readCookie).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  test("rejects invalid comment targets and source urls", async () => {
    const { request, dependencies } = setup();
    await expect(addComment(account, { ...input, oid: "0" }, dependencies)).rejects.toThrow(
      "评论来源 ID",
    );
    await expect(addComment(account, { ...input, type: 0 }, dependencies)).rejects.toThrow(
      "评论类型",
    );
    await expect(
      addComment(
        account,
        { ...input, sourceUrl: "https://example.com/video/BV1test/" },
        dependencies,
      ),
    ).rejects.toThrow("评论来源地址无效");
    expect(request).not.toHaveBeenCalled();
  });

  test("requires a login before posting", async () => {
    const { request, dependencies } = setup();
    dependencies.readCookie = vi.fn(async () => null);
    await expect(addComment(account, input, dependencies)).rejects.toBeInstanceOf(
      CommentLoginRequiredError,
    );
    expect(request).not.toHaveBeenCalled();
  });

  test("marks a successful response without a reply payload as uncertain", async () => {
    const { request, dependencies } = setup({ code: 0, message: "OK", data: null });
    await expect(addComment(account, input, dependencies)).rejects.toBeInstanceOf(
      CommentResultUnknownError,
    );
    expect(request).toHaveBeenCalledOnce();
  });
});

describe("64-bit comment ids", () => {
  const dynamicOid = "1249706685708107824";
  const dynamicSourceUrl = `https://www.bilibili.com/opus/${dynamicOid}`;
  const dynamicTarget: CommentTarget = {
    ...target,
    id: "317945292720",
    oid: dynamicOid,
    type: 17,
  };

  test("posts a top-level comment with the untouched oid", async () => {
    const { request, dependencies } = setup({
      code: 0,
      message: "OK",
      data: { reply: createReply() },
    });
    await addComment(
      account,
      { oid: dynamicOid, type: 17, message: "动态评论", sourceUrl: dynamicSourceUrl },
      dependencies,
    );
    expect(Object.fromEntries(new URLSearchParams(String(request.mock.calls[0][1]?.body)))).toEqual(
      {
        plat: "1",
        oid: dynamicOid,
        type: "17",
        message: "动态评论",
        at_name_to_mid: "{}",
        gaia_source: "main_web",
        statistics: '{"appId":100,"platform":5}',
        csrf: "a+b/==",
      },
    );
  });

  test("keeps the oid when liking, replying to and deleting a reply", async () => {
    const { request, dependencies } = setup({
      code: 0,
      message: "OK",
      data: { reply: createReply() },
    });
    await modifyCommentAttitude(
      account,
      { target: dynamicTarget, kind: "like", active: true, sourceUrl: dynamicSourceUrl },
      dependencies,
    );
    await addCommentReply(
      account,
      { target: dynamicTarget, message: "回复", sourceUrl: dynamicSourceUrl },
      dependencies,
    );
    await deleteComment(
      account,
      { target: dynamicTarget, sourceUrl: dynamicSourceUrl },
      dependencies,
    );

    const bodies = request.mock.calls.map((call) =>
      Object.fromEntries(new URLSearchParams(String(call[1]?.body))),
    );
    expect(bodies[0]).toMatchObject({ oid: dynamicOid, type: "17", rpid: "317945292720" });
    expect(bodies[1]).toMatchObject({
      oid: dynamicOid,
      type: "17",
      root: "317945292720",
      parent: "317945292720",
    });
    expect(bodies[2]).toMatchObject({ oid: dynamicOid, type: "17", rpid: "317945292720" });
  });

  test("keeps a 64-bit oid from the add-comment response", async () => {
    const replyText = JSON.stringify(createReply()).replace('"oid":1000', `"oid":${dynamicOid}`);
    const request = vi
      .fn<typeof fetch>()
      .mockImplementation(
        async () => new Response(`{"code":0,"message":"OK","data":{"reply":${replyText}}}`),
      );
    vi.stubGlobal("fetch", request);
    const dependencies: CommentRequestDependencies = {
      readCookie: vi.fn(async () => cookie),
      isCurrentAccount: vi.fn(() => true),
    };

    const comment = await addComment(
      account,
      { oid: dynamicOid, type: 17, message: "动态评论", sourceUrl: dynamicSourceUrl },
      dependencies,
    );
    expect(comment.oid).toBe(dynamicOid);
  });
});

describe("delete comment", () => {
  test("posts oid, type and rpid without the attitude statistics payload", async () => {
    const { request, dependencies } = setup({ code: 0, message: "0" });
    await deleteComment(account, { target, sourceUrl }, dependencies);
    expect(request).toHaveBeenCalledOnce();
    const [url, options] = request.mock.calls[0];
    const headers = new Headers(options?.headers);
    expect(url).toBe("https://api.bilibili.com/x/v2/reply/del");
    expect(options?.method).toBe("POST");
    expect(headers.get("cookie")).toBe(cookie);
    expect(headers.get("referer")).toBe(sourceUrl);
    expect(headers.get("content-type")).toBe("application/x-www-form-urlencoded");
    expect(Object.fromEntries(new URLSearchParams(String(options?.body)))).toEqual({
      oid: "1000",
      type: "1",
      rpid: "456",
      csrf: "a+b/==",
    });
  });

  test("rejects invalid targets before reading credentials", async () => {
    const { request, dependencies } = setup();
    await expect(
      deleteComment(account, { target: { ...target, id: "0" }, sourceUrl }, dependencies),
    ).rejects.toThrow("评论 ID");
    await expect(
      deleteComment(
        account,
        { target, sourceUrl: "https://example.com/video/BV1test/" },
        dependencies,
      ),
    ).rejects.toThrow("评论来源地址无效");
    expect(dependencies.readCookie).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  test("requires a login before deleting", async () => {
    const { request, dependencies } = setup();
    dependencies.readCookie = vi.fn(async () => null);
    await expect(
      deleteComment(account, { target, sourceUrl }, dependencies),
    ).rejects.toBeInstanceOf(CommentLoginRequiredError);
    expect(request).not.toHaveBeenCalled();
  });

  test("reports a business rejection", async () => {
    const { request, dependencies } = setup({ code: -404, message: "啥都木有" });
    await expect(deleteComment(account, { target, sourceUrl }, dependencies)).rejects.toThrow(
      "删除评论失败（-404）：啥都木有",
    );
    expect(request).toHaveBeenCalledOnce();
  });

  test("marks a network failure as uncertain without retrying", async () => {
    const { request, dependencies } = setup();
    request.mockRejectedValue(new Error("offline"));
    await expect(
      deleteComment(account, { target, sourceUrl }, dependencies),
    ).rejects.toBeInstanceOf(CommentResultUnknownError);
    expect(request).toHaveBeenCalledOnce();
  });
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
