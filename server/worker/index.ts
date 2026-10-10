import { Hono } from "hono";

import type { ServerBindings } from "./types";
import { registerRoutes } from "./routes";

/**
 * 补齐型安全响应头：必须为所有 Worker 直出的响应（含错误页与 API）设置。
 * CSP 只保留不涉及资源加载的指令，分享页的 iconify 脚本、B站播放器 iframe
 * 与 B站图片都不受影响。
 */
const SECURITY_HEADERS: ReadonlyArray<readonly [string, string]> = [
  [
    "Content-Security-Policy",
    "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  ],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Strict-Transport-Security", "max-age=31536000; includeSubDomains"],
  ["X-Content-Type-Options", "nosniff"],
];

/** 只补缺失的头，让 handler 自己设置的值（如 /users 的 Referrer-Policy）优先。 */
function applySecurityHeaders(headers: Headers) {
  for (const [name, value] of SECURITY_HEADERS) {
    if (!headers.has(name)) {
      headers.set(name, value);
    }
  }
  if (
    (headers.get("Content-Type") ?? "").includes("text/html") &&
    !headers.has("X-Frame-Options")
  ) {
    headers.set("X-Frame-Options", "DENY");
  }
}

function createApp() {
  const app = new Hono<{ Bindings: ServerBindings }>();

  app.use("*", async (c, next) => {
    await next();
    applySecurityHeaders(c.res.headers);
  });
  registerRoutes(app);
  app.notFound((c) => c.text("Not Found", 404));

  return app;
}

const app = createApp();

export default app;
export { createApp };
