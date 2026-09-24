import { BilibiliAuthExpiredError, isBilibiliAuthExpiredCode } from "./auth-expiration";

/**
 * 所有「可以通过重新登录解决」的错误都继承这个基类：
 * 缺少 Cookie、缺少 CSRF、游客弹幕受限等。
 * 调用方统一用 isLoginRequiredError 判断，不直接比较具体子类。
 */
export class LoginRequiredError extends Error {
  constructor(message = "请先登录 B站") {
    super(message);
    // 子类延续自己的类名，便于日志和排查
    this.name = new.target.name;
  }
}

function hasBilibiliAuthExpiredCode(error: object) {
  const code = (error as { code?: unknown }).code;
  return typeof code === "number" && isBilibiliAuthExpiredCode(code);
}

export function isLoginRequiredError(error: unknown): boolean {
  if (error instanceof LoginRequiredError || error instanceof BilibiliAuthExpiredError) {
    return true;
  }
  // 代理层会把上游响应原样抛出，兜底识别裸错误对象上的 -101/-111。
  return typeof error === "object" && error !== null && hasBilibiliAuthExpiredCode(error);
}
