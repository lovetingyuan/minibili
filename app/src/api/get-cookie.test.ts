import { afterEach, expect, test } from "vitest";

import { clearBilibiliLoginCookie, getCookie, saveBilibiliLoginCookie } from "./get-cookie";

afterEach(async () => {
  await clearBilibiliLoginCookie();
});

/**
 * 匿名 Cookie 生成已停用（见 get-cookie.ts 的注释），未登录时统一返回空串，
 * 而不是以前那套 buvid3/_uuid/buvid4 指纹。
 */
test("未登录时返回空 Cookie", async () => {
  expect(await getCookie()).toBe("");
});

test("保存登录 Cookie 后按原样返回", async () => {
  const cookie = "SESSDATA=session; DedeUserID=123; bili_jct=token";
  await saveBilibiliLoginCookie(cookie);
  expect(await getCookie()).toBe(cookie);
});
