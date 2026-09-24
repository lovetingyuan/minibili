import { validateBilibiliCookie } from "../../api/bilibili-auth";
import {
  clearBilibiliLoginCookie,
  getBilibiliLoginCookie,
  saveBilibiliLoginCookie,
} from "../../api/get-cookie";
import { clearWBIInfoCache } from "../../api/user-nav";
import { clearBilibiliAuthExpiration, reportBilibiliAuthExpired } from "./auth-expiration";
import { createBilibiliSession } from "./controller";
import { writeBilibiliWebViewCookies } from "./webview-cookies";

export const bilibiliSession = createBilibiliSession({
  readCookie: getBilibiliLoginCookie,
  saveCookie: saveBilibiliLoginCookie,
  clearCookie: clearBilibiliLoginCookie,
  validateCookie: validateBilibiliCookie,
  writeWebViewCookies: writeBilibiliWebViewCookies,
  onStoredCredentialsExpired() {
    reportBilibiliAuthExpired(-101);
  },
  onLoginSuccess() {
    clearBilibiliAuthExpiration();
    // 登录后 wbi key 要按新登录态重新取
    clearWBIInfoCache();
  },
  async clearNativeCookies() {
    const { default: CookieManager } = await import("@preeternal/react-native-cookie-manager");
    if (!(await CookieManager.clearAllStores())) {
      throw new Error("Cookie 清理失败，请重试退出登录");
    }
  },
});
