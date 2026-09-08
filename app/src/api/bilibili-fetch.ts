import { createBilibiliRequestHeaders, isBilibiliUrl } from "./bilibili-cookie.helpers";
import { getCookie } from "./get-cookie";

export default async function bilibiliFetch(
  url: string,
  options: RequestInit = {},
  withCookie = true,
) {
  if (!isBilibiliUrl(url)) {
    return fetch(url, options);
  }

  const cookie = withCookie ? await getCookie() : "";

  return fetch(url, {
    ...options,
    // Cookie 由统一会话提供，不让原生 Cookie 存储覆盖或重新注入已退出的账号。
    credentials: "omit",
    headers: createBilibiliRequestHeaders(url, options.headers, cookie),
  });
}
