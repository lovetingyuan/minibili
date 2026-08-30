import type { Cookie } from "@preeternal/react-native-cookie-manager";

import { BILIBILI_API_COOKIE_URL } from "../../api/bilibili-cookie.helpers";

export class BilibiliCookieModuleUnavailableError extends Error {
  constructor() {
    super("当前安装包缺少 Cookie 模块，请重新构建并安装最新版开发包或 APK。");
  }
}

export function parseBilibiliWebViewCookies(cookieHeader: string): Cookie[] {
  const cookies = new Map<string, Cookie>();
  for (const part of cookieHeader.split(";")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex < 1) {
      continue;
    }
    const name = part.slice(0, separatorIndex).trim();
    if (!name) {
      continue;
    }
    cookies.set(name, {
      name,
      value: part.slice(separatorIndex + 1).trim(),
      domain: ".bilibili.com",
      path: "/",
      secure: true,
      httpOnly: name === "SESSDATA",
    });
  }
  return [...cookies.values()];
}

export async function writeBilibiliWebViewCookies(cookieHeader: string) {
  const cookies = parseBilibiliWebViewCookies(cookieHeader);
  if (cookies.length === 0) {
    return;
  }

  let CookieManager: (typeof import("@preeternal/react-native-cookie-manager"))["default"];
  try {
    CookieManager = (await import("@preeternal/react-native-cookie-manager")).default;
  } catch {
    throw new BilibiliCookieModuleUnavailableError();
  }

  // 逐项等待原生操作完成；失败时不能留下仍在执行、可能晚于退出清理的写入。
  for (const cookie of cookies) {
    if (!(await CookieManager.set(BILIBILI_API_COOKIE_URL, cookie, false))) {
      throw new Error("Cookie 同步失败，请重试");
    }
    if (process.env.EXPO_OS === "ios") {
      if (!(await CookieManager.set(BILIBILI_API_COOKIE_URL, cookie, true))) {
        throw new Error("Cookie 同步失败，请重试");
      }
    }
  }
}
