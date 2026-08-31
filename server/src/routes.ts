import { handleHealth, handleIndexPage } from "./handlers/app";
import { handleGetReleases } from "./handlers/api/releases";
import { handleSyncUserData } from "./handlers/api/user-data";
import type { AppType } from "./types";

function registerRoutes(app: AppType) {
  app.get("/health", handleHealth);

  app.get("/api/releases", handleGetReleases);
  app.post("/api/user-data/sync", handleSyncUserData);

  app.get("/", handleIndexPage);
}

export { registerRoutes };
