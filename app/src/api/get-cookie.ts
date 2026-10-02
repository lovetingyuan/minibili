import {
  clearStoredBilibiliCookie,
  getStoredBilibiliCookie,
  setStoredBilibiliCookie,
} from "../utils/secure-store";

/**
 * 旧匿名 Cookie（buvid3/_uuid/buvid4 + bili_ticket 签名 + 定时刷新）的逻辑已停用，
 * 需要时看 git 历史。未登录时统一返回空串，请求不带 Cookie。
 */

let storedCookie: string | null | undefined;
let storedCookieVersion = 0;

export async function getBilibiliLoginCookie() {
  if (storedCookie === undefined) {
    const version = storedCookieVersion;
    const cookie = await getStoredBilibiliCookie();
    if (version === storedCookieVersion) {
      storedCookie = cookie;
    }
  }
  return storedCookie ?? null;
}

export async function getCookie() {
  const cookie = await getBilibiliLoginCookie().catch(() => null);
  return cookie?.trim() ? cookie : "";
}

export async function saveBilibiliLoginCookie(cookie: string) {
  await setStoredBilibiliCookie(cookie);
  storedCookieVersion += 1;
  storedCookie = cookie;
}

export async function clearBilibiliLoginCookie() {
  storedCookieVersion += 1;
  storedCookie = null;
  await clearStoredBilibiliCookie();
}
