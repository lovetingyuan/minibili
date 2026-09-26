import { Hono } from "hono";

import type { ServerBindings } from "./types";
import { registerRoutes } from "./routes";

function createApp() {
  const app = new Hono<{ Bindings: ServerBindings }>();

  registerRoutes(app);
  app.notFound((c) => c.text("Not Found", 404));

  return app;
}

const app = createApp();

export default app;
export { createApp };
export { UserDirectory } from "./UserDirectory";
export { UserStorage } from "./UserStorage";
