import { handleHealth, handleIndexPage } from "./handlers/app";
import {
  handleAuthStatus,
  handleLogout,
  handleSendOtp,
  handleVerifyOtp,
} from "./handlers/api/auth";
import { handleGetReleases } from "./handlers/api/releases";
import { handleSyncUser } from "./handlers/api/users";
import type { AppType } from "./types";

function registerRoutes(app: AppType) {
  app.get("/health", handleHealth);

  app.get("/api/releases", handleGetReleases);
  app.post("/api/auth/otp", handleSendOtp);
  app.post("/api/auth/verify", handleVerifyOtp);
  app.post("/api/auth/status", handleAuthStatus);
  app.post("/api/auth/logout", handleLogout);
  app.post("/api/users/:email/sync", handleSyncUser);

  app.get("/", handleIndexPage);
}

export { registerRoutes };
