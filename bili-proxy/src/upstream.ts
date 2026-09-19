import { BILI_ORIGIN } from "./contract.js";

export interface UpstreamResult {
  body: string;
  contentType: string;
  status: number;
}

export class UpstreamTimeoutError extends Error {}

/** 转发一次请求到 B 站，状态码与响应体原样带回去。 */
export async function requestUpstream(
  path: string,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<UpstreamResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${BILI_ORIGIN}${path}`, {
      headers,
      // Node 的 fetch 默认就是 follow，这里显式写出来，避免以后被当成 manual 处理。
      redirect: "follow",
      signal: controller.signal,
    });
    return {
      body: await response.text(),
      contentType: response.headers.get("content-type") ?? "application/json; charset=utf-8",
      status: response.status,
    };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new UpstreamTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
