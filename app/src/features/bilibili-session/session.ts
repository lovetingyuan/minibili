import { validateBilibiliCookie } from "../../api/bilibili-auth";
import {
  clearBilibiliLoginCookie,
  getBilibiliLoginCookie,
  saveBilibiliLoginCookie,
} from "../../api/get-cookie";
import { createBilibiliSession } from "./controller";
import { writeBilibiliWebViewCookies } from "./webview-cookies";

export const bilibiliSession = createBilibiliSession({
  readCookie: getBilibiliLoginCookie,
  saveCookie: saveBilibiliLoginCookie,
  clearCookie: clearBilibiliLoginCookie,
  validateCookie: validateBilibiliCookie,
  writeWebViewCookies: writeBilibiliWebViewCookies,
  async clearNativeCookies() {
    const { default: CookieManager } = await import("@preeternal/react-native-cookie-manager");
    if (!(await CookieManager.clearAllStores())) {
      throw new Error("Cookie 清理失败，请重试退出登录");
    }
  },
});
