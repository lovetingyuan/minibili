import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  BilibiliAuthExpiredError,
  bilibiliAuthExpiration,
  clearBilibiliAuthExpiration,
  isBilibiliAuthExpiredCode,
  reportBilibiliAuthExpired,
} from "./auth-expiration";

beforeEach(() => {
  clearBilibiliAuthExpiration();
});

describe("B站登录失效事件", () => {
  test("只识别需要重新登录的错误码", () => {
    expect(isBilibiliAuthExpiredCode(-101)).toBe(true);
    expect(isBilibiliAuthExpiredCode(-111)).toBe(true);
    expect(isBilibiliAuthExpiredCode(-352)).toBe(false);
  });

  test("并发错误只发布一次，且每个调用方仍收到带错误码的错误", () => {
    const listener = vi.fn();
    const unsubscribe = bilibiliAuthExpiration.subscribe(listener);

    const first = reportBilibiliAuthExpired(-101, "账号未登录", "/x/test");
    const second = reportBilibiliAuthExpired(-111, "csrf 校验失败", "/x/other");

    expect(first).toBeInstanceOf(BilibiliAuthExpiredError);
    expect(first).toMatchObject({ code: -101, url: "/x/test" });
    expect(second).toMatchObject({ code: -111, url: "/x/other" });
    expect(listener).toHaveBeenCalledOnce();
    expect(bilibiliAuthExpiration.getSnapshot().error).toBe(first);
    unsubscribe();
  });

  test("登录成功清除事件后允许再次发布", () => {
    const listener = vi.fn();
    bilibiliAuthExpiration.subscribe(listener);

    reportBilibiliAuthExpired(-101);
    clearBilibiliAuthExpiration();
    reportBilibiliAuthExpired(-111);

    expect(listener).toHaveBeenCalledTimes(3);
    expect(bilibiliAuthExpiration.getSnapshot().error?.code).toBe(-111);
  });
});
