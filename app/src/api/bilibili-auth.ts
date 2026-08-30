import { UA } from "../constants";
import { BilibiliAuthResponseSchema, BilibiliMyInfoDataSchema } from "./bilibili-auth.schema";
import type { BilibiliProfile } from "./bilibili-auth.types";
import { createBilibiliRequestHeaders } from "./bilibili-cookie.helpers";

const MYINFO_URL = "https://api.bilibili.com/x/space/v2/myinfo";

export async function validateBilibiliCookie(
  cookie: string,
  signal?: AbortSignal,
): Promise<BilibiliProfile | null> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort);
  if (signal?.aborted) {
    abort();
  }
  const timeout = setTimeout(abort, 15000);

  try {
    const response = await fetch(MYINFO_URL, {
      headers: createBilibiliRequestHeaders(
        MYINFO_URL,
        {
          accept: "application/json",
          referer: "https://space.bilibili.com/",
          "user-agent": UA,
          "cache-control": "no-cache",
        },
        cookie,
      ),
      // 只验证指定的 Cookie，避免原生 Cookie 存储混入另一份登录凭证。
      credentials: "omit",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`登录状态检查失败（HTTP ${response.status}）`);
    }
    const payload = BilibiliAuthResponseSchema.parse(await response.json());
    if (payload.code === 0) {
      const { profile, follower } = BilibiliMyInfoDataSchema.parse(payload.data);
      return { ...profile, follower };
    }
    if (payload.code === -101) {
      return null;
    }
    throw new Error(`登录状态检查失败（${payload.code}）`);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
