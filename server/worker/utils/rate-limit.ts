import type { AppContext } from "../types";

/** 限流窗口是 60 秒，被拒时统一让调用方等待一个窗口。 */
export const RATE_LIMIT_RETRY_AFTER = "60";

/** 限流只做滥用防护，key 不落盘；取不到真实 IP 时用固定占位符。 */
export function getClientIp(c: AppContext) {
  return c.req.header("CF-Connecting-IP") ?? "unknown";
}

/**
 * 调用一次限流计数，返回本次请求是否已被拒绝。
 * 限流自身故障时放行（可用性优先），只记日志不抛错。
 */
export async function isRateLimited(limiter: RateLimit, scope: string, actor: string) {
  try {
    const { success } = await limiter.limit({ key: `${scope}:${actor}` });
    return !success;
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "rate limit check failed",
        scope,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return false;
  }
}
