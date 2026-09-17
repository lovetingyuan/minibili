import type { VercelRequest, VercelResponse } from "@vercel/node";

import { MAX_REQUEST_BYTES, TOKEN_HEADER } from "../src/contract.js";
import { handleBiliProxy } from "../src/handler.js";

/** 与核心逻辑保持一致的超限响应，避免先把超大 body 读进来。 */
function tooLargeResult() {
  return {
    body: JSON.stringify({ error: "request_too_large" }),
    headers: { "content-type": "application/json; charset=utf-8", "x-proxy-source": "relay" },
    status: 413,
  };
}

/** Vercel 会把 JSON 请求体解析进 req.body，这里还原成文本再交给核心逻辑统一校验。 */
function readRawBody(request: VercelRequest): string {
  if (typeof request.body === "string") return request.body;
  if (request.body === undefined || request.body === null) return "";
  return JSON.stringify(request.body);
}

function readHeader(request: VercelRequest, name: string): string | null {
  const value = request.headers[name];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const contentLength = Number(readHeader(request, "content-length") ?? "0");
  const result =
    Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES
      ? tooLargeResult()
      : await handleBiliProxy(
          {
            body: readRawBody(request),
            method: request.method ?? "GET",
            token: readHeader(request, TOKEN_HEADER),
          },
          { token: process.env.BILI_PROXY_TOKEN },
        );

  response.status(result.status);
  for (const [name, value] of Object.entries(result.headers)) response.setHeader(name, value);
  response.send(result.body);
}
