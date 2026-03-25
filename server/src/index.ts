import { Hono } from "hono";

import type { ServerBindings } from "./types";
import { registerRoutes } from "./routes";

function createApp() {
  const app = new Hono<{ Bindings: ServerBindings }>();

  registerRoutes(app);
  app.notFound((c) => {
    const { method, path } = c.req;
    const canServeAsset =
      (method === "GET" || method === "HEAD") && !path.startsWith("/api/") && path !== "/health";

    if (canServeAsset) {
      return c.env.ASSETS.fetch(c.req.raw);
    }

    return c.text("Not Found", 404);
  });

  return app;
}

const app = createApp();

export default app;
export { createApp };
export { UserStorage } from "./UserStorage";
