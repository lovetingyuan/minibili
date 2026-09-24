import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  bilibiliFetch: vi.fn(),
  showLoginRequiredAlert: vi.fn(),
}));

vi.mock("./bilibili-fetch", () => ({ default: mocks.bilibiliFetch }));
vi.mock("./user-nav", () => ({ getWBIInfo: vi.fn() }));
vi.mock("../features/bilibili-session/login-required-alert", () => ({
  showLoginRequiredAlert: mocks.showLoginRequiredAlert,
}));
vi.mock("../constants", () => ({ UA: "test-agent" }));
vi.mock("../utils/wbi", () => ({ default: vi.fn() }));

import {
  BilibiliAuthExpiredError,
  bilibiliAuthExpiration,
  clearBilibiliAuthExpiration,
} from "../features/bilibili-session/auth-expiration";
import request from "./fetcher";

beforeEach(() => {
  vi.clearAllMocks();
  clearBilibiliAuthExpiration();
});

describe("统一 B站请求", () => {
  test.each([-101, -111] as const)("错误码 %i 发布登录失效事件", async (code) => {
    mocks.bilibiliFetch.mockResolvedValue(
      new Response(JSON.stringify({ code, message: "expired", data: null })),
    );

    await expect(request("/x/test")).rejects.toMatchObject({ code } satisfies Pick<BilibiliAuthExpiredError, "code">);
    expect(bilibiliAuthExpiration.getSnapshot().error?.code).toBe(code);
  });

  test("其他业务错误保持原有 API Error", async () => {
    mocks.bilibiliFetch.mockResolvedValue(
      new Response(JSON.stringify({ code: -352, message: "风控", data: null })),
    );

    await expect(request("/x/test")).rejects.toMatchObject({
      name: "API Error",
      code: -352,
    });
    expect(bilibiliAuthExpiration.getSnapshot().error).toBeNull();
  });

  test("nav 未登录时照样返回数据，wbi 签名不受影响", async () => {
    const wbi_img = {
      img_url: "https://i0.hdslb.com/bfs/wbi/img.png",
      sub_url: "https://i0.hdslb.com/bfs/wbi/sub.png",
    };
    mocks.bilibiliFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          code: -101,
          message: "账号未登录",
          data: { isLogin: false, wbi_img },
        }),
      ),
    );

    await expect(request("/x/web-interface/nav")).resolves.toEqual({ isLogin: false, wbi_img });
    expect(mocks.showLoginRequiredAlert).toHaveBeenCalledOnce();
    expect(bilibiliAuthExpiration.getSnapshot().error?.code).toBe(-101);
  });
});
