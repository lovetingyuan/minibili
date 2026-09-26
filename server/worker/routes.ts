import { handleHealth } from "./handlers/app";
import { handleGetReleases } from "./handlers/api/releases";
import { handleSyncUserData } from "./handlers/api/user-data";
import { handleShareHtmlRedirect, handleSharePage } from "./handlers/share";
import { handleUsersPage } from "./handlers/users";
import type { AppType } from "./types";

function registerRoutes(app: AppType) {
  app.get("/health", handleHealth);

  app.get("/share", handleSharePage);
  app.get("/share.html", handleShareHtmlRedirect);
  app.get("/users", handleUsersPage);

  app.get("/api/releases", handleGetReleases);
  app.post("/api/user-data/sync", handleSyncUserData);
}

export { registerRoutes };
