import { describe, expect, test } from "vitest";

import { BilibiliAuthExpiredError } from "./auth-expiration";
import { isLoginRequiredError, LoginRequiredError } from "./login-required";

describe("isLoginRequiredError", () => {
  test("识别统一的登录类错误基类与子类", () => {
    class RelationLikeLoginRequiredError extends LoginRequiredError {}

    expect(isLoginRequiredError(new LoginRequiredError())).toBe(true);
    expect(isLoginRequiredError(new LoginRequiredError("登录凭据失效"))).toBe(true);
    expect(isLoginRequiredError(new RelationLikeLoginRequiredError("请先登录 B站"))).toBe(true);
  });

  test("默认文案是请先登录 B站", () => {
    expect(new LoginRequiredError().message).toBe("请先登录 B站");
    expect(new LoginRequiredError().name).toBe("LoginRequiredError");
  });

  test("识别 -101/-111 的登录失效错误", () => {
    expect(isLoginRequiredError(new BilibiliAuthExpiredError(-101))).toBe(true);
    expect(isLoginRequiredError(new BilibiliAuthExpiredError(-111))).toBe(true);
  });

  test("兜底识别带登录错误码的裸错误对象", () => {
    expect(isLoginRequiredError(Object.assign(new Error("账号未登录"), { code: -101 }))).toBe(true);
    expect(isLoginRequiredError({ code: -111 })).toBe(true);
  });

  test("其他错误与非法入参不视为需要登录", () => {
    expect(isLoginRequiredError(new Error("网络错误"))).toBe(false);
    expect(isLoginRequiredError(Object.assign(new Error("风控"), { code: -352 }))).toBe(false);
    expect(isLoginRequiredError({ code: " -101" })).toBe(false);
    expect(isLoginRequiredError(null)).toBe(false);
    expect(isLoginRequiredError(undefined)).toBe(false);
    expect(isLoginRequiredError("boom")).toBe(false);
  });
});
